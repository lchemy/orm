import { QueryBuilder, Transaction } from "knex";
import * as Knex from "knex";

import { AttachFilterMode } from "../../enums";
import { Orm, Table } from "../../models";
import { attachFilter, withTransaction } from "../../utilities";

import { RemovePlan } from "./plan";

export class RemoveExecutor {
	private orm: Orm;
	private schema: Table;
	private database!: Knex;

	constructor(
		protected plan: RemovePlan,
		protected transaction?: Transaction
	) {
		this.orm = this.plan.orm;
		this.schema = this.orm["🜀"].schema as Table;
	}

	async execute(): Promise<number> {
		await this.getDatabase();

		this.assertExecutable();

		return withTransaction(async (trx) => {
			const expected = this.plan.expected,
				actual = await this.executeRemove(trx) as number;

			if (expected != null && expected !== actual) {
				throw new Error(`Expected remove to delete ${ expected } rows but actually deleted ${ actual } rows`);
			}

			return actual;
		}, this.database, this.transaction);
	}

	private assertExecutable(): void {
		if (!(this.schema instanceof Table)) {
			throw new Error(`Cannot execute insert on orm with non-table schema ${ this.orm }`);
		}
	}

	private executeRemove(trx: Transaction): QueryBuilder | number {
		const filter = this.plan.filter;
		if (filter === false) {
			return 0;
		}

		const qb = this.database(this.schema["🜃"].table).del().transacting(trx);
		attachFilter(this.database,
			// @ts-ignore
			qb,
			filter,
			AttachFilterMode.WHERE,
			false);
		// @ts-ignore
		return qb;
	}

	private async getDatabase(): Promise<void> {
		this.database = await this.orm["🜀"].schema["🜃"].database;
	}
}
