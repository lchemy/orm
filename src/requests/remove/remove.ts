import { Transaction } from "knex";

import { Orm, OrmRef, RemoveManyRequestBuilder, RemoveOneRequestBuilder, RemoveWithFilterRequestBuilder } from "../../models";

import { RemoveExecutor } from "./executor";
import { RemoveManyPlanner, RemoveWithFilterPlanner } from "./planner";

export async function removeWithFilter<O extends Orm, A = any>(ormRef: OrmRef<O>, builder: RemoveWithFilterRequestBuilder<O, A>, trx?: Transaction): Promise<number> {
	const orm = await ormRef["🜅"],
		planner = new RemoveWithFilterPlanner(orm, builder(orm)),
		plan = planner.getPlan(),
		executor = new RemoveExecutor(plan, trx);
	return executor.execute();
}

export async function removeMany<O extends Orm, A = any>(ormRef: OrmRef<O>, builder: RemoveManyRequestBuilder<A>, trx?: Transaction): Promise<number> {
	const orm = await ormRef["🜅"],
		planner = new RemoveManyPlanner(orm, builder()),
		plan = planner.getPlan(),
		executor = new RemoveExecutor(plan, trx);
	return executor.execute();
}

export async function removeOne<O extends Orm, A = any>(ormRef: OrmRef<O>, builder: RemoveOneRequestBuilder<A>, trx?: Transaction): Promise<boolean> {
	return removeMany(ormRef, () => {
		const { item, auth } = builder();
		return {
			items: [item],
			auth
		};
	}, trx).then((res) => res === 1);
}
