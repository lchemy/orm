import { Transaction } from "knex";
import * as Knex from "knex";

import { AttachFilterMode } from "../../enums";
import { Orm, Table, WrappedRaw } from "../../models";
import { attachFilter, withTransaction } from "../../utilities";

import { UpdateChange, UpdatePlan } from "./plan";

export class UpdateExecutor {
	private orm: Orm;
	private schema: Table;
	private database!: Knex;

	constructor(
		protected plan: UpdatePlan,
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
				actual = await this.executeUpdate(trx);

			if (expected != null && expected !== actual) {
				throw new Error(`Expected update to change ${ expected } rows but actually changed ${ actual } rows`);
			}

			return actual;
		}, this.database, this.transaction);
	}

	private assertExecutable(): void {
		if (!(this.schema instanceof Table)) {
			throw new Error(`Cannot execute insert on orm with non-table schema ${ this.orm }`);
		}
	}

	private async executeUpdate(trx: Transaction): Promise<number> {
		let total = 0;
		await this.plan.changes.reduce(async (prev, change) => {
			await prev;
			total += await this.executeUpdateChange(trx, change);
		}, Promise.resolve());
		return total;
	}

	private async executeUpdateChange(trx: Transaction, change: UpdateChange): Promise<number> {
		if (change.filter === false) {
			return 0;
		}

		const qb = this.database(this.schema["🜃"].table).del().transacting(trx);
		attachFilter(this.database, qb, change.filter, AttachFilterMode.WHERE, false);

		change.set.forEach((value, key) => {
			if (value instanceof WrappedRaw) {
				value = value.toRaw(this.database);
			}
			qb.update(key, value);
		});

		const res = await qb;
		return res;
	}

	private async getDatabase(): Promise<void> {
		this.database = await this.orm["🜀"].schema["🜃"].database;
	}
}
