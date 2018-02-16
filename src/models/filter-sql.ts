import { List } from "immutable";
import * as Knex from "knex";

import { WrappedRaw } from "./wrapped-raw";

export class FilterSql {
	constructor(public sql: string, public bindings: List<any>) {

	}

	getBindings(db: Knex): any[] {
		return this.bindings.toArray().map((value) => {
			if (value instanceof WrappedRaw) {
				return value.toRaw(db);
			} else {
				return value;
			}
		});
	}
}
