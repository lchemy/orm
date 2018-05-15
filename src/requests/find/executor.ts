import { List, Map, Set } from "immutable";
import { QueryBuilder, Transaction } from "knex";
import * as Knex from "knex";

import { AttachFilterMode, SortDirection } from "../../enums";
import {
	AggregateField, AggregateOrm, ColumnField, DerivedField, Filter, JoinManyField,
	JoinManyFieldProperties, JoinOn, JoinOneField, Orm, Pagination, RelationalOrm,
	SortBy, SortDirectionLike, Subquery, Table, booleanDatum
} from "../../models";
import { attachFilter, filterToSql, getDbDialect, getExistsCheckValue, normalizeSortDirection, wrapIdentifier } from "../../utilities";

import { FindCountPlan, FindModelsPlan, FindPlan } from "./plan";

export abstract class FindExecutor<Plan extends FindPlan> {
	protected orm: Orm;
	protected database!: Knex;
	protected dialect!: string;
	protected knexQuery!: QueryBuilder;

	private subqueryIndex: number = 0;

	constructor(
		protected plan: Plan,
		protected baseRows?: object[],
		protected transaction?: Transaction
	) {
		this.orm = plan.query.orm;
	}

	async execute(): Promise<number | object[]> {
		await this.getDatabase();

		this.assertExecutable();

		if (this.canShortCircuitExecution()) {
			return this.plan.query.count ? 0 : [];
		}

		this.buildKnexQuery();

		if (this.orm instanceof RelationalOrm) {
			return this.executeRelational();
		} else {
			return this.executeAggregate();
		}
	}

	protected abstract executeAggregate(): Promise<number | object[]>;
	protected abstract executeRelational(): Promise<number | object[]>;

	protected buildKnexQuery(): void {
		const qb = this.database.table(this.ormToTable(this.orm) as any);

		if (this.transaction != null) {
			qb.transacting(this.transaction);
		}

		const { filter, joins, groupBy } = this.plan.query;

		if (filter != null) {
			attachFilter(this.database, qb, filter, AttachFilterMode.WHERE);
		}

		joins.entrySeq().toList().sortBy(([joinOrm]) => {
			return joinOrm["🜀"].depth;
		}).forEach(([joinOrm, joinFilter]) => {
			this.addJoin(qb, joinOrm, joinFilter);
		});

		if (groupBy != null) {
			this.addGroupBy(qb, groupBy);
		}

		this.knexQuery = qb;
	}

	protected assertExecutable(): void {
		// assert that joins are all join ones
		this.plan.query.joins.forEach((_, joinOrm: Orm) => {
			const joinOrmProps = joinOrm["🜀"],
				joinedBy = joinOrmProps.joinedBy;
			if (joinedBy == null || !(joinedBy instanceof JoinOneField)) {
				throw new Error(`Expected orm to be join one: ${ joinOrm }`);
			}
		});
	}

	protected canShortCircuitExecution(): boolean {
		// short circuit based on filter
		if (this.plan.query.filter === false) {
			return true;
		}

		// short circuit based on required join missing
		const requiredJoinsFailed = this.plan.query.joins.some((joinFilter: Filter | boolean, joinOrm: Orm) => {
			if (typeof joinFilter !== "boolean") {
				return false;
			}

			if (isNestedOptionalJoin(joinOrm)) {
				return false;
			}

			return !joinFilter;
		});

		return requiredJoinsFailed;
	}

	protected ormToTable(orm: Orm): QueryBuilder | string {
		const schema = orm["🜀"].schema,
			tableAs = orm["🜀"].tableAs;

		if (schema as any instanceof Subquery) {
			const subquery = (schema as Subquery)["🜃"].subquery(this.database).as(`sub${ this.subqueryIndex++ }`);
			return this.database.table(subquery as any).as(tableAs);
		} else if (schema as any instanceof Table) {
			return `${ (schema as Table)["🜃"].table } AS ${ tableAs }`;
		} else {
			throw new Error(`Unexpected schema ${ schema }`);
		}
	}

	protected addJoin(qb: QueryBuilder, joinOrm: Orm, joinFilter: Filter | boolean): void {
		const joinOrmProps = joinOrm["🜀"],
			joinedBy = joinOrmProps.joinedBy as JoinOneField,
			joinFieldProps = joinedBy["🜁"],
			through = joinFieldProps.through;

		[...through, {
			orm: joinOrm,
			on: joinFilter
		}].forEach((joinOn) => {
			this.addJoinOn(qb, joinOn);
		});

		if (!isNestedOptionalJoin(joinOrm)) {
			qb.andWhere(this.database.raw(getExistsCheckValue(this.database, joinOrm)));
		}
	}

	protected addJoinOn(qb: QueryBuilder, joinOn: JoinOn<Orm>): void {
		const table = this.ormToTable(joinOn.orm);
		qb.leftJoin(table, (clause) => {
			attachFilter(this.database, clause, joinOn.on, AttachFilterMode.ON);
		});
	}

	protected addGroupBy(qb: QueryBuilder, groupBy: Set<ColumnField | DerivedField>): void {
		groupBy.forEach((field) => {
			if (field instanceof DerivedField) {
				const fieldSql = field["🜁"].getFieldSql(this.database);
				qb.groupBy(this.database.raw(`(${ fieldSql })`));
			} else {
				qb.groupBy(field["🜁"].fieldName);
			}
		});
	}

	private async getDatabase(): Promise<void> {
		this.database = await this.orm["🜀"].schema["🜃"].database;
		this.dialect = getDbDialect(this.database);
	}
}

export class FindCountExecutor extends FindExecutor<FindCountPlan> {
	protected executeAggregate(): Promise<number> {
		this.knexQuery.select(this.database.raw("1")).as("agg");

		const qb = this.database.table(this.knexQuery as any);
		qb.column(this.database.raw("COUNT(*) AS count"));
		return this.executeQuery(qb);
	}

	protected executeRelational(): Promise<number> {
		this.knexQuery.column(this.database.raw("COUNT(*) AS count"));
		return this.executeQuery(this.knexQuery);
	}

	private async executeQuery(qb: QueryBuilder): Promise<number> {
		const res = await qb as Array<{ count: number }>;
		return res.length > 0 ? Number(res[0].count) : 0;
	}
}

export class FindModelsExecutor extends FindExecutor<FindModelsPlan> {
	protected canShortCircuitExecution(): boolean {
		const superShortCircuit = super.canShortCircuitExecution();
		if (superShortCircuit) {
			return true;
		}

		// check if base join
		const baseJoinedBy = this.orm["🜀"].base["🜀"].joinedBy;
		if (this.baseRows != null && baseJoinedBy != null && baseJoinedBy instanceof JoinManyField) {
			const baseJoinFieldProps = baseJoinedBy["🜁"] as JoinManyFieldProperties<Orm>,
				primaryFields = baseJoinFieldProps.orm["🜀"].primaryFields.toArray();

			const missingBasePrimaryFields = this.baseRows.every((baseRow) => {
				return primaryFields.some((field) => {
					return (baseRow as any)[field["🜁"].fieldPath] === undefined;
				});
			});

			if (missingBasePrimaryFields) {
				return true;
			}
		}

		return false;
	}

	protected buildKnexQuery(): void {
		super.buildKnexQuery();

		const qb = this.knexQuery;

		const { fields, sortBy, groupBy, pagination } = this.plan.query;

		this.addFields(qb, fields, groupBy);

		if (sortBy != null) {
			this.addSortBy(qb, sortBy);
		}

		if (pagination != null) {
			this.addPagination(qb, pagination);
		}

		this.addBaseJoin(qb, this.orm, this.baseRows);
	}

	protected executeAggregate(): Promise<object[]> {
		const qb = this.database.table(this.knexQuery.as("agg") as any);
		qb.column("agg.*");

		this.addAggregateGroupBy(qb, this.plan.query.fields, this.plan.query.groupBy!);

		return this.executeQuery(qb);
	}

	protected executeRelational(): Promise<object[]> {
		this.addJoinExistChecks(this.knexQuery, this.plan.query.joins.keySeq().toArray());
		return this.executeQuery(this.knexQuery);
	}

	private async executeQuery(qb: QueryBuilder): Promise<object[]> {
		const rows = await qb as object[];
		return rows.map((row: any) => {
			const out = {} as Record<string, any>;

			let extractionFields = this.plan.query.fields;

			const baseJoinedBy = this.orm["🜀"].base["🜀"].joinedBy;
			if (baseJoinedBy != null) {
				if (baseJoinedBy instanceof JoinManyField) {
					const partitionedBy = (baseJoinedBy as JoinManyField)["🜁"].partitionedBy;
					if (partitionedBy != null) {
						const partitions = partitionedBy["🜁"].partitions;
						Object.keys(partitions).forEach((key) => {
							const checkAs = getPartitionCheckAs(this.orm, key),
								checkPath = getPartitionCheckPath(this.orm, key);
							out[checkPath] = booleanDatum.parseValue(this.dialect, row[checkAs]);
						});
					}
				}

				const primaryFields = baseJoinedBy["🜁"].orm["🜀"].primaryFields.toArray();
				extractionFields = extractionFields.concat(primaryFields);
			}

			// TODO: simplify this?
			let nestedCheckAs = Map<Orm, Set<string>>();
			const buildNestedExistsCheckAs = (orm: Orm) => {
				if (nestedCheckAs.has(orm)) {
					return;
				}

				const requiredChildOrms = (orm["🜀"].fields.filter((field) => {
					return field instanceof JoinOneField && !(field as JoinOneField)["🜁"].optional;
				}) as Set<JoinOneField>).map((field) => {
					return field["🜁"].join;
				});
				requiredChildOrms.forEach((childOrm) => buildNestedExistsCheckAs(childOrm));

				const childChecks = requiredChildOrms.flatMap((childOrm) => nestedCheckAs.get(childOrm)!).toSet(),
					selfCheck = childChecks.add(getExistsCheckAs(orm));
				nestedCheckAs = nestedCheckAs.set(orm, selfCheck);
			};

			const nonExistingJoinOrms = this.plan.query.joins.keySeq().filter((joinOrm) => {
				buildNestedExistsCheckAs(joinOrm);
				return nestedCheckAs.get(joinOrm)!.some((existsCheckAs) => {
					return !row[existsCheckAs];
				});
			}).toSet();

			extractionFields.forEach((field) => {
				if (nonExistingJoinOrms.has(field["🜁"].orm)) {
					return;
				}

				const fieldAs = field["🜁"].fieldAs;
				let fieldPath = field["🜁"].fieldPath;

				// check if field is from a pluck join one and change path to the pluck field's path if so
				if (field instanceof ColumnField || field instanceof DerivedField) {
					const fieldOrmJoinedBy = field["🜁"].orm["🜀"].joinedBy;
					if (fieldOrmJoinedBy != null && fieldOrmJoinedBy instanceof JoinOneField) {
						const fieldPluckedBy = (fieldOrmJoinedBy as JoinOneField)["🜁"].pluckedBy;
						if (fieldPluckedBy != null) {
							fieldPath = fieldPluckedBy["🜁"].fieldPath;
						}
					}
				}

				if (field instanceof AggregateField) {
					out[fieldPath] = field["🜁"].datum.parseValue(this.dialect, row[fieldAs]);
				} else if (field instanceof DerivedField) {
					out[fieldPath] = field["🜁"].datum.parseValue(this.dialect, row[fieldAs]);
				} else {
					out[fieldPath] = field["🜁"].column.datum.parseValue(this.dialect, row[fieldAs]);

					const aliasField = field["🜁"].alias;
					if (aliasField != null) {
						const aliasPath = aliasField["🜁"].fieldPath;
						out[aliasPath] = out[fieldPath];
					}
				}
			});

			return out;
		});
	}

	private addFields(qb: QueryBuilder, fields: Set<ColumnField | DerivedField | AggregateField>, groupBy?: Set<ColumnField | DerivedField>): void {
		if (this.orm instanceof AggregateOrm) {
			fields.forEach((field) => {
				if (field instanceof AggregateField) {
					this.addAggregateField(qb, field);
				} else if (groupBy != null && groupBy.has(field)) {
					if (field instanceof DerivedField) {
						this.addDerivedField(qb, field);
					} else {
						this.addColumnField(qb, field);
					}
				} else {
					// throw new Error(`Unexpected ungrouped dimension field ${ field }`);
				}
			});
		} else {
			fields.forEach((field) => {
				if (field instanceof DerivedField) {
					this.addDerivedField(qb, field);
				} else if (field instanceof ColumnField) {
					this.addColumnField(qb, field);
				} else {
					throw new Error(`Unexpected field ${ field }`);
				}
			});
		}
	}

	private addAggregateField(qb: QueryBuilder, field: AggregateField): void {
		const aggregationSql = field["🜁"].getFieldSql(this.database),
			aggregationAs = wrapIdentifier(this.database, field["🜁"].fieldAs);
		qb.column(this.database.raw(`(${ aggregationSql }) AS ${ aggregationAs }`));
	}

	private addDerivedField(qb: QueryBuilder, field: DerivedField): void {
		const fieldSql = field["🜁"].getFieldSql(this.database),
			fieldAs = field["🜁"].fieldAs;
		qb.column(this.database.raw(`(${ fieldSql }) AS ${ fieldAs }`));
	}

	private addColumnField(qb: QueryBuilder, field: ColumnField): void {
		qb.column(`${ field["🜁"].fieldName } AS ${ field["🜁"].fieldAs }`);
	}

	private addSortBy(qb: QueryBuilder, sortBy: SortBy[]): void {
		sortBy.forEach((s) => {
			if (s.field instanceof AggregateField) {
				this.addSortAggregateField(qb, s.field, s.direction);
			} else if (s.field instanceof DerivedField) {
				this.addSortDerivedField(qb, s.field, s.direction);
			} else {
				this.addSortColumnField(qb, s.field, s.direction);
			}
		});
	}

	private addSortColumnField(qb: QueryBuilder, field: ColumnField, direction: SortDirectionLike): void {
		this.addSort(qb, field["🜁"].fieldName, direction);
	}

	private addSortDerivedField(qb: QueryBuilder, field: DerivedField, direction: SortDirectionLike): void {
		const fieldSql = field["🜁"].getFieldSql(this.database);
		this.addSort(qb, this.database.raw(`(${ fieldSql })`), direction);
	}

	private addSortAggregateField(qb: QueryBuilder, field: AggregateField, direction: SortDirectionLike): void {
		const aggregationSql = field["🜁"].getFieldSql(this.database);
		this.addSort(qb, this.database.raw(`(${ aggregationSql })`), direction);
	}

	private addSort(qb: QueryBuilder, sortTarget: string | Knex.Raw, direction: SortDirectionLike): void {
		qb.orderBy(sortTarget as any, normalizeSortDirection(direction) === SortDirection.ASCENDING ? "ASC" : "DESC");
	}

	private addPagination(qb: QueryBuilder, pagination: Pagination): void {
		let offset = 0,
			limit: number | null = null;
		if (pagination != null) {
			if (pagination.offset != null) {
				offset = pagination.offset;
			}
			if (pagination.limit !== undefined) {
				limit = pagination.limit;
			}
		}

		if (offset < 0) {
			offset = 0;
		}
		qb.offset(offset);

		if (limit != null) {
			if (limit < 0) {
				limit = 0;
			}
			qb.limit(limit);
		}
	}

	private addJoinExistChecks(qb: QueryBuilder, joinOrms: Orm[]): void {
		joinOrms.forEach((joinOrm: Orm) => {
			const existsCheckValue = getExistsCheckValue(this.database, joinOrm),
				existsCheckAs = wrapIdentifier(this.database, getExistsCheckAs(joinOrm));
			qb.column(this.database.raw(`(${ existsCheckValue }) AS ${ existsCheckAs }`));
		});
	}

	private addBaseJoin(qb: QueryBuilder, orm: Orm, baseRows?: object[]): void {
		const baseJoinedBy = orm["🜀"].base["🜀"].joinedBy;
		if (baseJoinedBy == null) {
			return;
		}
		if (!(baseJoinedBy instanceof JoinManyField)) {
			throw new Error("Expected to be join many");
		}
		if (baseRows == null) {
			throw new Error(`Expected results for join many`);
		}

		const baseJoinFieldProps = baseJoinedBy["🜁"] as JoinManyFieldProperties<Orm>,
			baseThrough = baseJoinFieldProps.through,
			primaryFields = baseJoinFieldProps.orm["🜀"].primaryFields.toArray();

		// add base joins
		[...baseThrough, {
			orm: baseJoinFieldProps.orm,
			on: baseJoinFieldProps.on
		}].forEach((joinOn) => {
			this.addJoinOn(qb, joinOn);
		});

		// add query to check primary fields from base results
		const rawQuery = primaryFields.map((field) => {
			const fieldAs = wrapIdentifier(this.database, field["🜁"].fieldName);
			return `${ fieldAs } = ?`;
		}).join(" AND ");

		qb.andWhere((qb1) => {
			// TODO: do this better!
			Set(baseRows!.map((baseRow) => {
				return List(primaryFields.map((field) => (baseRow as any)[field["🜁"].fieldPath]));
			})).filter((bindings) => {
				return bindings.every((binding) => binding !== undefined);
			}).forEach((bindings) => {
				qb1.orWhere(this.database.raw(rawQuery, bindings.toArray()));
			});
		});

		// add primary fields to select
		primaryFields.forEach((field) => {
			this.addColumnField(qb, field);
		});

		// if mapped join many, add partition checks
		if (baseJoinFieldProps.partitionedBy != null) {
			const partitions = (baseJoinedBy as JoinManyField)["🜁"].partitionedBy!["🜁"].partitions;
			Object.keys(partitions).forEach((key) => {
				const filterSql = filterToSql(this.database, partitions[key]),
					checkAs = wrapIdentifier(this.database, getPartitionCheckAs(orm, key));

				// TOOD: do this better?
				if (orm instanceof AggregateOrm) {
					qb.column(this.database.raw(`MIN(${ filterSql.sql }) AS ${ checkAs }`, filterSql.getBindings(this.database)));
				} else {
					qb.column(this.database.raw(`(${ filterSql.sql }) AS ${ checkAs }`, filterSql.getBindings(this.database)));
				}
			});
		}
	}

	private addAggregateGroupBy(qb: QueryBuilder, fields: Set<ColumnField | DerivedField | AggregateField>, groupBy: Set<ColumnField | DerivedField>): void {
		const groupByOrms = groupBy!.map((field) => field["🜁"].orm).filter((fieldOrm) => {
			return fieldOrm instanceof RelationalOrm;
		});

		// partition group by orms to simplified and
		const groupByOrmsPartitions = groupByOrms.groupBy((fieldOrm) => {
			const primaryFields = fieldOrm["🜀"].primaryFields;
			return !primaryFields.isEmpty() && groupBy.isSuperset(primaryFields) ? "simplified" : "untouched";
		});

		// get orms that were simplified in group by
		const simplifiedGroupByOrms = groupByOrmsPartitions.get("simplified", Set<Orm>()) as Set<Orm>;

		// get orms that were not simplified in group by
		const untouchedGroupByOrms = groupByOrmsPartitions.get("untouched", Set<Orm>()) as Set<Orm>;

		// add exists check for each join
		simplifiedGroupByOrms.forEach((joinOrm) => {
			const existsCheckValue = joinOrm["🜀"].primaryFields.map((field) => {
				return `${ wrapIdentifier(this.database, `agg.${ field["🜁"].fieldAs }`) } IS NOT NULL`;
			}).join(" AND ");
			const existsCheckAs = wrapIdentifier(this.database, getExistsCheckAs(joinOrm));

			qb.column(this.database.raw(`(${ existsCheckValue }) AS ${ existsCheckAs }`));
		});

		untouchedGroupByOrms.forEach((joinOrm) => {
			const existsCheckAs = wrapIdentifier(this.database, getExistsCheckAs(joinOrm));

			qb.column(this.database.raw(`1 AS ${ existsCheckAs }`));
		});

		// get the fields that need to be joined for
		const additionalJoinFields = fields.filter((field) => {
			return simplifiedGroupByOrms.has(field["🜁"].orm) && (
				(field instanceof ColumnField && !field["🜁"].primary) ||
				field instanceof DerivedField
			);
		});

		const additionalJoinOrms = additionalJoinFields.map((field) => field["🜁"].orm);

		// join each orm to get additional fields
		additionalJoinOrms.forEach((joinOrm) => {
			const table = this.ormToTable(joinOrm);
			qb.leftJoin(table, (clause) => {
				joinOrm["🜀"].primaryFields.forEach((field) => {
					const aggIdentifier = wrapIdentifier(this.database, `agg.${ field["🜁"].fieldAs }`),
						fieldIdentifier = wrapIdentifier(this.database, field["🜁"].fieldName);
					clause.andOn(this.database.raw(`${ aggIdentifier } = ${ fieldIdentifier }`));
				});
			});
		});

		// select non-primary fields
		additionalJoinFields.forEach((field) => {
			if (field instanceof DerivedField) {
				this.addDerivedField(qb, field);
			} else if (field instanceof ColumnField) {
				this.addColumnField(qb, field);
			} else {
				throw new Error(`Unexpected field ${ field }`);
			}
		});
	}
}

export function getExistsCheckAs(orm: Orm): string {
	return `${ orm["🜀"].tableAs }__exists`;
}

export function getPartitionCheckAs(orm: Orm, key: string): string {
	return `${ orm["🜀"].tableAs }__partition_${ key }`;
}

export function getPartitionCheckPath(orm: Orm, key: string): string {
	return `${ orm["🜀"].tablePath }$__partition_${ key }`;
}

export function isNestedOptionalJoin(orm: Orm): boolean {
	const { parent } = orm["🜀"];
	if (isOptionalJoin(orm)) {
		return true;
	}
	if (parent == null) {
		return false;
	}
	return isNestedOptionalJoin(parent);
}

export function isOptionalJoin(orm: Orm): boolean {
	const { joinedBy } = orm["🜀"];
	if (joinedBy == null || !(joinedBy instanceof JoinOneField)) {
		return true;
	}
	if ((joinedBy as JoinOneField)["🜁"].optional) {
		return true;
	}
	return false;
}
