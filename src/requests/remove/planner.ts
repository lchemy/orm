import { AndFilterGroup, Filter, OrFilterGroup, Orm, RemoveManyRequest, RemoveRequest, RemoveWithFilterRequest, Table } from "../../models";
import { getFieldValue, mergeFilterWithAuth, processAliases } from "../../utilities";

import { RemovePlan } from "./plan";

export abstract class RemovePlanner {
	protected plan!: RemovePlan;

	constructor(
		protected requestOrm: Orm,
		protected removeRequest: RemoveRequest
	) {

	}

	getPlan(): RemovePlan {
		return this.plan;
	}

	protected abstract buildPlan(): RemovePlan;
}

export class RemoveWithFilterPlanner extends RemovePlanner {
	constructor(
		requestOrm: Orm,
		protected removeRequest: RemoveWithFilterRequest
	) {
		super(requestOrm, removeRequest);
		this.plan = this.buildPlan();
	}

	protected buildPlan(): RemovePlan {
		// asser that the orm can be removed from (is table)
		const orm = this.requestOrm;
		if (!(orm["🜀"].schema instanceof Table)) {
			throw new Error(`Cannot remove from orm with a non-table schema ${ orm }`);
		}

		// formulate plan
		const { filter, expected, auth } = this.removeRequest;

		return {
			orm,
			filter: mergeFilterWithAuth(orm, filter, auth),
			expected
		};
	}
}

export class RemoveManyPlanner extends RemovePlanner {
	constructor(
		requestOrm: Orm,
		protected removeRequest: RemoveManyRequest
	) {
		super(requestOrm, removeRequest);
		this.plan = this.buildPlan();
	}

	protected buildPlan(): RemovePlan {
		// assert that the orm has primary fields and can be removed from (is table)
		const orm = this.requestOrm;
		if (!(orm["🜀"].schema instanceof Table)) {
			throw new Error(`Cannot remove from orm with a non-table schema ${ orm }`);
		}
		if (orm["🜀"].primaryFields.size === 0) {
			throw new Error(`Cannot remove items from orm without primary fields ${ orm }`);
		}

		// process aliases of request orm (shouldn't be necessary)
		processAliases(orm);

		// formulate plan
		const { items, auth } = this.removeRequest;
		return {
			orm,
			filter: mergeFilterWithAuth(orm, this.buildRemoveFilter(), auth),
			expected: items.length
		};
	}

	private buildRemoveFilter(): Filter {
		const primaryFields = this.requestOrm["🜀"].primaryFields;

		const rowExpressions = this.removeRequest.items.map((item) => {
			const primaryFieldExpressions = primaryFields.toArray().map((field) => {
				const value = getFieldValue(field, item);
				if (value == null) {
					throw new Error(`Cannot remove item with missing primary field ${ field }: ${ item }`);
				}
				return field.$eq(value);
			});
			return new AndFilterGroup(primaryFieldExpressions);
		});

		return new OrFilterGroup(rowExpressions);
	}
}
