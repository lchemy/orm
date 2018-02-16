import { Transaction } from "knex";

import { Orm, OrmRef, UpdateManyRequestBuilder, UpdateOneRequestBuilder, UpdateWithFilterRequestBuilder } from "../../models";

import { UpdateExecutor } from "./executor";
import { UpdateManyPlanner, UpdateWithFilterPlanner } from "./planner";

export async function updateWithFilter<O extends Orm, A = any>(ormRef: OrmRef<O>, builder: UpdateWithFilterRequestBuilder<O, A>, trx?: Transaction): Promise<number> {
	const orm = await ormRef["🜅"],
		planner = new UpdateWithFilterPlanner(orm, builder(orm)),
		plan = planner.getPlan(),
		executor = new UpdateExecutor(plan, trx);
	return executor.execute();
}

export async function updateMany<O extends Orm, A = any>(ormRef: OrmRef<O>, builder: UpdateManyRequestBuilder<O, A>, trx?: Transaction): Promise<number> {
	const orm = await ormRef["🜅"],
		planner = new UpdateManyPlanner(orm, builder(orm)),
		plan = planner.getPlan(),
		executor = new UpdateExecutor(plan, trx);
	return executor.execute();
}

export async function updateOne<O extends Orm, A = any>(ormRef: OrmRef<O>, builder: UpdateOneRequestBuilder<O, A>, trx?: Transaction): Promise<boolean> {
	return updateMany(ormRef, (orm) => {
		const { fields, item, auth } = builder(orm);
		return {
			fields,
			items: [item],
			auth
		};
	}, trx).then((res) => res === 1);
}
