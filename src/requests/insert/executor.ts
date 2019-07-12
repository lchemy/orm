import { QueryBuilder, Transaction } from "knex";
import * as Knex from "knex";

import { DIALECTS_WITH_RETURNING } from "../../constants";
import { Orm, Table, WrappedRaw } from "../../models";
import { getDbDialect, unflatten, withTransaction } from "../../utilities";

import { InsertPlan } from "./plan";

export class InsertExecutor {
	private orm: Orm;
	private schema: Table;
	private database!: Knex;
	private dialect!: string;

	constructor(
		protected plan: InsertPlan,
		protected transaction?: Transaction
	) {
		this.orm = this.plan.orm;
		this.schema = this.orm["🜀"].schema as Table;
	}

	async execute(): Promise<object[]> {
		await this.getDatabase();

		this.assertExecutable();

		return withTransaction(async (trx) => {
			let results;
			if (DIALECTS_WITH_RETURNING.includes(this.dialect)) {
				results = await this.executeWithReturning(trx);
			} else {
				results = await this.executeWithoutReturning(trx);
			}

			// check results matches expectation
			const expected = this.plan.items.length,
				actual = results.length;
			if (expected !== actual) {
				throw new Error(`Expected insert to create ${ expected } rows but actually created ${ actual } rows`);
			}

			return results;
		}, this.database, this.transaction);
	}

	private assertExecutable(): void {
		if (!(this.schema instanceof Table)) {
			throw new Error(`Cannot execute insert on orm with non-table schema ${ this.orm }`);
		}

		// assert dialects that do not support returning only have one primary field
		if (!DIALECTS_WITH_RETURNING.includes(this.dialect) && this.orm["🜀"].primaryFields.size > 1) {
			throw new Error(`Cannot execute insert on orm with more than one primary keys ${ this.orm } for database dialect ${ this.dialect }`);
		}
	}

	private async executeWithReturning(trx: Transaction): Promise<object[]> {
		const qb = this.buildKnexQuery(trx);

		const primaryFields = this.orm["🜀"].primaryFields,
			returning = primaryFields.map((field) => field["🜁"].column.name);

		qb.returning(returning.toArray());

		const results = await qb as Array<Record<string, any>>;

		return results.map((row) => {
			const item = primaryFields.reduce((memo, field) => {
				const { column, path } = field["🜁"];
				memo[path.slice(1).join("$")] = row[column.name];
				return memo;
			}, {} as Record<string, any>);
			return unflatten(item);
		});
	}

	private async executeWithoutReturning(trx: Transaction): Promise<object[]> {
		await this.buildKnexQuery(trx);

		let insertStatsQb, ids;
		if (this.dialect === "sqlite3") {
			insertStatsQb = trx.select([
				this.database.raw("LAST_INSERT_ROWID() AS lastId"),
				this.database.raw(`${ this.plan.items.length } AS rowCount`)
			]);
		let { lastId, rowCount } = (await insertStatsQb)[0] as { lastId: number, rowCount: number };
		ids = Array(rowCount).fill(undefined).map((_, i) => lastId - rowCount + i + 1);
		} else if (this.dialect === "mysql") {
			insertStatsQb = trx.select([
				this.database.raw("LAST_INSERT_ID() AS lastId"),
				this.database.raw(`ROW_COUNT() AS rowCount`)
			]);
			let { lastId, rowCount } = (await insertStatsQb)[0] as { lastId: number, rowCount: number };
			ids = Array(rowCount).fill(undefined).map((_, i) => lastId + rowCount - i - 1);
		} else {
			throw new Error(`Insert for dialect ${ this.dialect } has not been implemented yet`);
		}

		const idField = this.orm["🜀"].primaryFields.first<never>()!;
		const idPath = idField["🜁"].path.slice(1).join("$");

		return ids.map((id) => {
			const item = {
				[idPath]: id
			};
			return unflatten(item);
		});
	}

	private buildKnexQuery(trx: Transaction): QueryBuilder {
		const items = this.plan.items;

		const insertItems = items.map((item) => {
			return Object.entries(item).reduce((memo, [key, value]) => {
				if (value instanceof WrappedRaw) {
					value = value.toRaw(this.database);
				}
				(memo as any)[key] = value;
				return memo;
			}, {});
		});

		return this.database(this.schema["🜃"].table).insert(insertItems).transacting(trx);
	}

	private async getDatabase(): Promise<void> {
		this.database = await this.orm["🜀"].schema["🜃"].database;
		this.dialect = getDbDialect(this.database);
	}
}
