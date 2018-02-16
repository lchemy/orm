import { Set } from "immutable";

import { ColumnField, InsertManyRequest, Orm, Table } from "../../models";
import { getFieldValue, processAliases } from "../../utilities";

import { InsertPlan } from "./plan";

export class InsertPlanner {
	private fields!: ColumnField[];

	private plan: InsertPlan;

	constructor(
		private requestOrm: Orm,
		private insertRequest: InsertManyRequest
	) {
		this.plan = this.buildPlan();
	}

	getPlan(): InsertPlan {
		return this.plan;
	}

	private buildPlan(): InsertPlan {
		// assert that the orm has primary fields and can be inserted to
		const orm = this.requestOrm,
			primaryFields = orm["🜀"].primaryFields;
		if (!(orm["🜀"].schema instanceof Table)) {
			throw new Error(`Cannot insert to orm with a non-table schema ${ orm }`);
		}
		if (primaryFields.size === 0) {
			throw new Error(`Cannot insert to orm without primary fields ${ orm }`);
		}

		// process aliases of fields' orms' parents
		this.processAllAliases();

		// get the normalized fields and assert that there are some fields and the primary fields are a subset of them
		const normalizedFields = this.getNormalizedInsertFields();
		if (normalizedFields.size === 0) {
			throw new Error(`Expected insert fields to have at least one field`);
		}
		this.fields = normalizedFields.toArray();

		// build the query and plan objects
		const items = this.extractInsertItems();

		return {
			orm,
			items
		};
	}

	private processAllAliases(): void {
		// process orm's aliases
		processAliases(this.requestOrm);

		// get all fields' orms' parents
		const parentOrms = Set(this.insertRequest.fields).map((field) => {
			return field["🜁"].orm["🜀"].parent;
		}).filter((orm) => orm != null) as Set<Orm>;

		// process aliases for each parent orm
		parentOrms.forEach((orm) => {
			processAliases(orm);
		});
	}

	private getNormalizedInsertFields(): Set<ColumnField> {
		const requestOrm = this.requestOrm;

		return Set(this.insertRequest.fields).map((field) => {
			const { orm, alias } = field["🜁"];

			// if field's orm is the insert orm, use field
			if (orm === requestOrm) {
				return field;
			}

			// if alias exists and the alias's orm is the insert orm, use alias instead
			if (alias != null && alias["🜁"].orm === requestOrm) {
				return alias;
			}

			// otherwise it is probably referencing a joined column field, throw an expectation error
			throw new Error(`Expected insert field ${ field } to be related to ${ requestOrm } directly or via alias`);
		}).filter((field) => field != null);
	}

	private extractInsertItems(): object[] {
		const items = this.insertRequest.items,
			fields = this.fields;

		// extract the values from each item for each field
		return items.map((item) => {
			return fields.reduce((memo, field) => {
				const { column, primary } = field["🜁"],
					key = column.name,
					value = getFieldValue(field, item);

				// if primary and value is null, throw an expectation error
				if (primary && value == null) {
					throw new Error(`Expected primary field ${ field } to be defined for insert item ${ item }`);
				}

				memo[key] = value;

				return memo;
			}, {} as Record<string, any>);
		});
	}
}
