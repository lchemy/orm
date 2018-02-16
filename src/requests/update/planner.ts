import { Map, Seq } from "immutable";

import { AndFilterGroup, ColumnField, Filter, OrFilterGroup, Orm, Table, UpdateManyRequest, UpdateRequest, UpdateWithFilterRequest } from "../../models";
import { getFieldValue, mergeFilterWithAuth, processAliases } from "../../utilities";

import { UpdateChange, UpdatePlan } from "./plan";

export abstract class UpdatePlanner {
	protected plan!: UpdatePlan;

	constructor(
		protected requestOrm: Orm,
		protected updateRequest: UpdateRequest
	) {

	}

	getPlan(): UpdatePlan {
		return this.plan;
	}

	protected abstract buildPlan(): UpdatePlan;

	protected getRelatedField(field: ColumnField): ColumnField {
		const requestOrm = this.requestOrm,
			{ orm, alias } = field["🜁"];

		if (orm === requestOrm) {
			return field;
		} else if (alias != null && alias["🜁"].orm === requestOrm) {
			return alias;
		} else {
			throw new Error(`Expected field ${ field } to be related to orm ${ requestOrm } directly or via alias`);
		}
	}
}

export class UpdateWithFilterPlanner extends UpdatePlanner {
	constructor(
		requestOrm: Orm,
		protected updateRequest: UpdateWithFilterRequest
	) {
		super(requestOrm, updateRequest);
		this.plan = this.buildPlan();
	}

	protected buildPlan(): UpdatePlan {
		// assert that the orm can updated (is table)
		const orm = this.requestOrm;
		if (!(orm["🜀"].schema instanceof Table)) {
			throw new Error(`Cannot update orm with a non-table schema ${ orm }`);
		}

		processAliases(orm);

		const { values, filter, expected, auth } = this.updateRequest;

		// get the columns to set for query
		const setValues = values.reduce((memo, value) => {
			const relatedField = this.getRelatedField(value.field),
				key = relatedField["🜁"].column.name;
			return memo.set(key, value.value);
		}, Map<string, any>());

		// formulate plan
		return {
			orm,
			changes: [{
				set: setValues,
				filter: mergeFilterWithAuth(orm, filter, auth)
			}],
			expected
		};
	}
}

export class UpdateManyPlanner extends UpdatePlanner {
	constructor(
		requestOrm: Orm,
		protected updateRequest: UpdateManyRequest
	) {
		super(requestOrm, updateRequest);
		this.plan = this.buildPlan();
	}

	protected buildPlan(): UpdatePlan {
		// assert that the orm has primary fields and can be removed from (is table)
		const orm = this.requestOrm;
		if (!(orm["🜀"].schema instanceof Table)) {
			throw new Error(`Cannot update orm with a non-table schema ${ orm }`);
		}
		if (orm["🜀"].primaryFields.size === 0) {
			throw new Error(`Cannot update items with orm without primary fields ${ orm }`);
		}

		// process aliases of request orm (shouldn't be necessary)
		processAliases(orm);

		// formulate plan
		return {
			orm,
			changes: this.buildUpdateChanges(),
			expected: this.updateRequest.items.length
		};
	}

	private buildUpdateChanges(): UpdateChange[] {
		const { items, fields, auth } = this.updateRequest;

		const itemsBySetValues = Seq(items).reduce((memo0, item) => {
			const setValues = fields.reduce((memo1, field) => {
				const relatedField = this.getRelatedField(field),
					key = relatedField["🜁"].column.name,
					value = getFieldValue(field, item);
				return memo1.set(key, value);
			}, Map<string, any>());

			return memo0.update(setValues, [], (value) => value.concat(item));
		}, Map<Map<string, any>, object[]>());

		const filtersBySetValues = itemsBySetValues.map((setValuesItems) => {
			return this.buildUpdateFilter(setValuesItems);
		});

		return filtersBySetValues.entrySeq().toArray().map(([setValues, filter]) => {
			return {
				set: setValues,
				filter: mergeFilterWithAuth(this.requestOrm, filter, auth)
			};
		});
	}

	private buildUpdateFilter(items: object[]): Filter {
		const primaryFields = this.requestOrm["🜀"].primaryFields;

		const rowExpressions = items.map((item) => {
			const primaryFieldExpressions = primaryFields.toArray().map((field) => {
				const value = getFieldValue(field, item);
				if (value == null) {
					throw new Error(`Cannot update item with missing primary field ${ field }: ${ item }`);
				}
				return field.$eq(value);
			});
			return new AndFilterGroup(primaryFieldExpressions);
		});

		return new OrFilterGroup(rowExpressions);
	}
}
