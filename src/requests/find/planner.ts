import { Map, Set } from "immutable";

import {
	AggregateField,
	AggregateOrm,
	ColumnField,
	Composite,
	DerivedField,
	Field,
	Filter,
	FindAllRequest,
	FindCountRequest,
	FindRequest,
	JoinField,
	JoinManyField,
	JoinManyPartitions,
	JoinOneField,
	Orm,
	Pagination,
	PartitionedJoinManyField,
	PluckedJoinManyField,
	PluckedJoinOneField,
	SortBy,
	isComposite
} from "../../models";
import { getBaseParentOrm, normalizeSortBy, processAliases, simplifyGroupBy } from "../../utilities";

import { FindCountPlan, FindModelsPlan, FindPlan } from "./plan";

export type FindableField = ColumnField | DerivedField | AggregateField;

export abstract class FindPlanner<Plan extends FindPlan> {
	protected fields: Set<FindableField> = Set();
	protected aliasedFieldsByOrm: Map<Orm, Set<ColumnField>> = Map();
	protected orms: Set<Orm> = Set();
	protected filters: Map<Orm, Filter | boolean> = Map();

	protected ormsByBase: Map<Orm, Set<Orm>> = Map();
	protected fieldsByBase: Map<Orm, Set<FindableField>> = Map();

	protected plan!: Plan;

	constructor(
		protected requestOrm: Orm,
		protected findRequest: FindRequest
	) {

	}

	getPlan(): Plan {
		return this.plan;
	}

	protected abstract buildPlan(): Plan;

	protected addOrm(orm: Orm): void {
		if (this.orms.has(orm)) {
			return;
		}
		this.orms = this.orms.add(orm);

		// add parent orm
		const parent = orm["🜀"].parent;
		if (parent != null) {
			this.addOrm(parent);
		}

		// add required join one orms
		(orm["🜀"].fields.filter((field) => {
			return field instanceof JoinOneField && !(field as JoinOneField)["🜁"].optional;
		}) as Set<JoinOneField>).forEach((field) => {
			this.addOrm(field["🜁"].join);
		});

		// if joined by is join many, add parent's primary fields
		const joinedBy = orm["🜀"].joinedBy;
		if (joinedBy != null && joinedBy instanceof JoinManyField) {
			const primaryFields = (joinedBy as JoinManyField)["🜁"].orm["🜀"].primaryFields;
			primaryFields.forEach((field) => {
				this.addField(field);
			});
		}

		// add orm filters
		this.addOrmFilter(orm);

		// add orm to temporary map for lookup in building plan
		const baseOrm = orm["🜀"].base,
			baseOrms = this.ormsByBase.get(baseOrm, Set<Orm>()).add(orm);
		this.ormsByBase = this.ormsByBase.set(baseOrm, baseOrms);

		// unalias fields
		const aliasedFields = this.aliasedFieldsByOrm.get(orm);
		if (aliasedFields != null) {
			aliasedFields.forEach((field) => {
				this.removeAliasedField(field);
			});
			this.aliasedFieldsByOrm = this.aliasedFieldsByOrm.delete(orm);
		}
	}

	protected addField(field: Field | { [key: string]: Field }): void {
		if (field instanceof ColumnField) {
			this.addColumnField(field);
		} else if (field instanceof DerivedField) {
			this.addDerivedField(field);
		} else if (field instanceof AggregateField) {
			this.addAggregateField(field);
		} else if (field instanceof PluckedJoinOneField) {
			this.addPluckedJoinOneField(field);
		} else if (field instanceof PartitionedJoinManyField) {
			this.addPartitionedJoinManyField(field);
		} else if (field instanceof PluckedJoinManyField) {
			this.addPluckedJoinManyField(field);
		} else if (field instanceof JoinField) {
			this.addJoinField(field);
		} else if (isComposite(field)) {
			this.addComposite(field);
		} else {
			throw new Error(`Unknown field: ${ field }`);
		}
	}

	private addOrmFilter(orm: Orm): void {
		const ormFilters: Array<Filter | false> = [];

		// add the request filter if adding the query orm
		if (orm === this.requestOrm && this.findRequest.filter != null) {
			ormFilters.push(this.findRequest.filter);
		}

		// add join filter if join one orm
		const joinedBy = orm["🜀"].joinedBy;
		if (joinedBy != null && joinedBy instanceof JoinOneField) {
			ormFilters.push(joinedBy["🜁"].on);
		}

		// add auth filter if auth is provided by request
		// auth filter can return a filter, a boolean, or undefined
		const authFilter = this.getOrmAuthFilter(orm);
		if (authFilter instanceof Filter || authFilter === false) {
			ormFilters.push(authFilter);
		}

		if (ormFilters.length === 0) {
			return;
		}

		// merge the filters together with ands
		let mergedFilter: Filter | false;

		const alwaysFail = ormFilters.some((filter) => filter === false);
		if (alwaysFail) {
			mergedFilter = false;
		} else {
			mergedFilter = (ormFilters as Filter[]).reduce((memo, filter) => {
				return memo.and(filter);
			});
		}

		if (mergedFilter instanceof Filter) {
			mergedFilter.fields.map((field) => field["🜁"].orm).forEach((filterOrm) => {
				this.addOrm(filterOrm);
			});
		}

		// add filter to orm
		this.filters = this.filters.set(orm, mergedFilter);
	}

	private getOrmAuthFilter(orm: Orm): Filter | boolean | undefined {
		const auth = this.findRequest.auth;

		// do not use auth filter if no auth provided
		if (auth == null) {
			return undefined;
		}

		// get the auth filter builder
		let authFilterBuilder;

		// check if is join and if join overrode auth
		const joinedBy = orm["🜀"].joinedBy;
		if (joinedBy != null && joinedBy["🜁"].auth != null) {
			authFilterBuilder = joinedBy["🜁"].auth;
		} else if (orm["🜀"].auth != null) {
			authFilterBuilder = orm["🜀"].auth;
		}

		if (authFilterBuilder == null) {
			return undefined;
		}

		return authFilterBuilder(auth);
	}

	private addColumnField(field: ColumnField): void {
		const orm = field["🜁"].orm,
			parentOrm = orm["🜀"].parent;

		if (parentOrm != null) {
			processAliases(parentOrm);
		}

		const alias = field["🜁"].alias;
		if (alias != null && !this.orms.has(orm)) {
			// find out which one contains the other
			const fieldTableAs = orm["🜀"].tableAs,
				aliasTableAs = alias["🜁"].orm["🜀"].tableAs;

			// if field table contains field alias table, field alias table is the ancestor, use alias instead
			if (fieldTableAs.includes(aliasTableAs)) {
				const aliasedFields = this.aliasedFieldsByOrm.get(orm, Set<ColumnField>()).add(field);
				this.aliasedFieldsByOrm = this.aliasedFieldsByOrm.set(orm, aliasedFields);

				field = alias;
			}
		}

		this.actuallyAddField(field);
	}

	private addDerivedField(field: DerivedField): void {
		this.actuallyAddField(field);
	}

	private addAggregateField(field: AggregateField): void {
		this.actuallyAddField(field);
	}

	private addPluckedJoinOneField(field: PluckedJoinOneField): void {
		this.addField(field["🜁"].pluckField);
	}

	private addPartitionedJoinManyField(field: PartitionedJoinManyField): void {
		const defaultFields = field["🜁"].joinField["🜁"].join["🜀"].defaultFields;
		defaultFields.forEach((f) => this.addField(f));
	}

	private addPluckedJoinManyField(field: PluckedJoinManyField): void {
		this.addField(field["🜁"].pluckField);
	}

	private addJoinField(field: JoinField): void {
		const defaultFields = field["🜁"].join["🜀"].defaultFields;
		defaultFields.forEach((f) => this.addField(f));
	}

	private addComposite(composite: Composite): void {
		const { defaultFields, fields } = composite["🜂"],
			compositeFields = defaultFields.size > 0 ? defaultFields : fields;
		compositeFields.forEach((field) => this.addField(field));
	}

	private actuallyAddField(field: FindableField): void {
		if (this.fields.has(field)) {
			return;
		}

		// add field and its orm
		this.fields = this.fields.add(field);
		this.addOrm(field["🜁"].orm);

		// add field to temporary map for lookup in building plan
		const baseOrm = field["🜁"].orm["🜀"].base,
			baseFields = this.fieldsByBase.get(baseOrm, Set<FindableField>()).add(field);
		this.fieldsByBase = this.fieldsByBase.set(baseOrm, baseFields);
	}

	private removeAliasedField(field: ColumnField): void {
		const fieldOrm = field["🜁"].orm;

		const aliasedFields = this.aliasedFieldsByOrm.get(fieldOrm, Set<ColumnField>()).delete(field);
		this.aliasedFieldsByOrm = this.aliasedFieldsByOrm.set(fieldOrm, aliasedFields);

		const aliasField = field["🜁"].alias!,
			aliasBaseOrm = aliasField["🜁"].orm["🜀"].base,
			aliasBaseFields = this.fieldsByBase.get(aliasBaseOrm, Set<FindableField>()).delete(field);
		this.fieldsByBase = this.fieldsByBase.set(aliasBaseOrm, aliasBaseFields);
	}
}

export class FindCountPlanner extends FindPlanner<FindCountPlan> {
	constructor(
		protected requestOrm: Orm,
		protected findRequest: FindCountRequest
	) {
		super(requestOrm, findRequest);
		this.plan = this.buildPlan();
	}

	protected buildPlan(): FindCountPlan {
		this.addOrm(this.requestOrm);

		const { fields } = this.findRequest;
		if (fields != null) {
			fields.forEach((field) => this.addField(field));
		}

		return this.getCountPlan();
	}

	private getCountPlan(): FindCountPlan {
		const orm = this.requestOrm,
			joinOrms = this.ormsByBase.get(orm, Set<Orm>()).remove(orm),
			joins = this.filters.filter((_, filterOrm) => joinOrms.has(filterOrm)),
			fields = this.fieldsByBase.get(orm, Set<FindableField>()),
			filter = this.filters.get(orm)!;

		let groupBy: Set<ColumnField | DerivedField> | undefined;
		if (fields != null && orm instanceof AggregateOrm) {
			const groupableFields = fields.filter((field) => {
				return field instanceof ColumnField || field instanceof DerivedField;
			}) as Set<ColumnField | DerivedField>;
			if (groupableFields.size > 0) {
				groupBy = simplifyGroupBy(groupableFields);
			}
		}

		return {
			query: {
				orm,
				joins,
				filter,
				groupBy,
				count: true
			}
		};
	}
}

export class FindModelsPlanner extends FindPlanner<FindModelsPlan> {
	constructor(
		protected requestOrm: Orm,
		protected findRequest: FindAllRequest
	) {
		super(requestOrm, findRequest);
		this.plan = this.buildPlan();
	}

	protected buildPlan(): FindModelsPlan {
		this.addOrm(this.requestOrm);

		const { fields, sortBy } = this.findRequest;

		if (fields != null) {
			fields.forEach((field) => this.addField(field));
		} else {
			this.requestOrm["🜀"].defaultFields.forEach((field) => this.addField(field));
		}

		if (sortBy != null) {
			sortBy.map((s) => normalizeSortBy(s)).map((s) => s.field).forEach((field) => {
				this.addField(field);
			});
		}

		const baseOrms = this.ormsByBase.keySeq().toSet();

		// create raw plans
		const plans = baseOrms.reduce((memo, orm) => {
			return memo.set(orm, this.buildChildPlan(orm));
		}, Map<Orm, FindModelsPlan>());

		// create plan heirarchy
		plans.forEach((plan, orm) => {
			const baseParentOrm = getBaseParentOrm(orm);
			if (baseParentOrm == null || !plans.has(baseParentOrm)) {
				return;
			}

			const basePlan = plans.get(baseParentOrm)!;
			if (basePlan.pluckField != null) {
				// this should never happen
				throw new Error(`Unexpected base plan with pluck field`);
			}
			basePlan.children.push(plan);
		});

		return plans.get(this.requestOrm)!;
	}

	private buildChildPlan(orm: Orm): FindModelsPlan {
		const joinOrms = this.ormsByBase.get(orm, Set<Orm>()).remove(orm),
			joins = this.filters.filter((_, filterOrm) => joinOrms.has(filterOrm)),
			fields = this.fieldsByBase.get(orm, Set<FindableField>()),
			filter = this.filters.get(orm)!;

		let partitions: JoinManyPartitions<string> | undefined,
			sortBy: SortBy[] | undefined,
			pagination: Pagination | undefined,
			pluckField: ColumnField | DerivedField | undefined;

		let groupableFields: Set<ColumnField | DerivedField> | undefined;
		if (orm instanceof AggregateOrm) {
			groupableFields = fields.filter((field) => {
				return field instanceof ColumnField || field instanceof DerivedField;
			}) as Set<ColumnField | DerivedField>;
		}

		if (orm === this.requestOrm) {
			const requestSortBy = this.findRequest.sortBy;
			if (requestSortBy != null) {
				sortBy = requestSortBy.map((s) => normalizeSortBy(s));
			}

			pagination = this.findRequest.pagination;
		} else {
			const joinedBy = orm["🜀"].joinedBy;
			if (!(joinedBy instanceof JoinManyField)) {
				throw new Error(`Expected orm to be join many: ${ orm }`);
			}

			const joinedManyFieldProps = (joinedBy as JoinManyField)["🜁"];
			if (joinedManyFieldProps.partitionedBy != null) {
				partitions = joinedManyFieldProps.partitionedBy["🜁"].partitions;
			}

			if (joinedManyFieldProps.pluckedBy != null) {
				pluckField = joinedManyFieldProps.pluckedBy["🜁"].pluckField;
			}

			sortBy = joinedManyFieldProps.sortBy;

			if (groupableFields != null) {
				const parentPrimaryFields = joinedManyFieldProps.orm["🜀"].primaryFields;
				groupableFields = groupableFields.concat(parentPrimaryFields);
			}
		}

		const groupBy = groupableFields != null ? simplifyGroupBy(groupableFields) : undefined;

		return {
			query: {
				orm,
				joins,
				fields,
				filter,
				groupBy,
				sortBy,
				pagination,
				count: false
			},
			partitions,
			pluckField,
			children: []
		};
	}
}
