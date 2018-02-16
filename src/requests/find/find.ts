import { Transaction } from "knex";

import { FindAllRequestBuilder, FindAllWithCountRequestBuilder, FindCountRequestBuilder, FindOneRequestBuilder, FindRequestField, Orm, OrmRef } from "../../models";
import { mergeResultSets, normalizeSortBy, unflatten } from "../../utilities";

import { FindCountExecutor, FindModelsExecutor } from "./executor";
import { FindModelsPlan, } from "./plan";
import { FindCountPlanner, FindModelsPlanner } from "./planner";

const EMPTY_REQUEST_BUILDER = () => {
	return {};
};

export async function findCount<O extends Orm, A = any>(ormRef: OrmRef<O>, builder: FindCountRequestBuilder<O, A> = EMPTY_REQUEST_BUILDER, trx?: Transaction): Promise<number> {
	const orm = await ormRef["🜅"],
		planner = new FindCountPlanner(orm, builder(orm)),
		plan = planner.getPlan(),
		executor = new FindCountExecutor(plan, undefined, trx);
	return executor.execute() as Promise<number>;
}

export async function findAll<O extends Orm, A = any>(ormRef: OrmRef<O>, builder: FindAllRequestBuilder<O, A> = EMPTY_REQUEST_BUILDER, trx?: Transaction): Promise<object[]> {
	const orm = await ormRef["🜅"],
		planner = new FindModelsPlanner(orm, builder(orm));

	const executePlan = async (plan: FindModelsPlan, prevBaseRows?: object[]): Promise<object[]> => {
		const executor = new FindModelsExecutor(plan, prevBaseRows, trx),
			baseRows = await executor.execute() as object[];

		await plan.children.reduce(async (prev, child) => {
			await prev;
			const childRows = await executePlan(child, baseRows);
			mergeResultSets(child.query.orm, baseRows, childRows, child.partitions, child.pluckField);
		}, Promise.resolve());

		return baseRows;
	};

	const results = await executePlan(planner.getPlan());

	const root = orm["🜀"].name;
	return unflatten(results!).map((row) => row[root]);
}

export async function findOne<O extends Orm, A = any>(ormRef: OrmRef<O>, builder: FindOneRequestBuilder<O, A> = EMPTY_REQUEST_BUILDER, trx?: Transaction): Promise<object | undefined> {
	const results = await findAll(ormRef, builder, trx);
	return results[0];
}

export async function findAllWithCount<O extends Orm, A = any>(ormRef: OrmRef<O>, builder: FindAllWithCountRequestBuilder<O, A> = EMPTY_REQUEST_BUILDER, trx?: Transaction): Promise<{ count: number, rows: object[] }> {
	const orm = await ormRef["🜅"],
		request = builder(orm);

	const { fields, sortBy, parallel, pagination } = request;
	let countFields = [] as FindRequestField[];
	if (fields != null) {
		countFields = countFields.concat(fields);
	}
	if (sortBy != null) {
		const sortFields = sortBy.map((s) => normalizeSortBy(s)).map((s) => s.field);
		countFields = countFields.concat(sortFields);
	}

	const getCount = () => {
		return findCount(ormRef, () => {
			return {
				filter: request.filter,
				auth: request.auth,
				fields: countFields
			};
		}, trx);
	};
	const getRows = () => {
		return findAll(ormRef, () => request, trx);
	};

	let count: number,
		rows: object[];
	if (pagination != null && pagination.limit != null && pagination.limit <= 0) {
		count = await getCount();
		rows = [];
	} else if (parallel) {
		[count, rows] = await Promise.all([getCount(), getRows()]);
	} else {
		count = await getCount();
		rows = count > 0 ? await getRows() : [];
	}
	return { count, rows };
}
