import { Transaction } from "knex";

import { InsertManyRequestBuilder, InsertOneRequestBuilder, Orm, OrmRef } from "../../models";

import { InsertExecutor } from "./executor";
import { InsertPlanner } from "./planner";

export async function insertMany<O extends Orm>(ormRef: OrmRef<O>, builder: InsertManyRequestBuilder<O>, trx?: Transaction): Promise<object[]> {
	const orm = await ormRef["🜅"],
		planner = new InsertPlanner(orm, builder(orm)),
		plan = planner.getPlan(),
		executor = new InsertExecutor(plan, trx);
	return executor.execute();
}

export async function insertOne<O extends Orm>(ormRef: OrmRef<O>, builder: InsertOneRequestBuilder<O>, trx?: Transaction): Promise<object> {
	const rows = await insertMany(ormRef, (orm) => {
		const { fields, item } = builder(orm);
		return {
			fields,
			items: [item]
		};
	}, trx);
	return rows[0];
}
