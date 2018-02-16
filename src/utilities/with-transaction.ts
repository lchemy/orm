import { Transaction } from "knex";
import * as Knex from "knex";

export async function withTransaction<T>(
	executor: (tx: Transaction) => T | Promise<T>,
	db: Knex,
	trx?: Transaction
): Promise<T> {
	if (trx != null) {
		return executor(trx);
	} else {
		return db.transaction(async (tx) => executor(tx));
	}
}
