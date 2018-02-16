import * as Knex from "knex";
import { QueryBuilder } from "knex";

import { $Schema, SchemaMapping, SchemaProperties } from "./schema";

export class SubqueryProperties extends SchemaProperties {
	alias!: string;
	subquery!: (db: Knex) => QueryBuilder;
}
export class $Subquery extends $Schema {
	"🜃": SubqueryProperties;

	constructor() {
		super();

		Object.defineProperty(this, "🜁", {
			value: new SubqueryProperties()
		});
	}

	toString(): string {
		return this["🜃"].alias;
	}
}
export type Subquery<S extends SchemaMapping = SchemaMapping> = $Subquery & S;
// tslint:disable-next-line:variable-name
export const Subquery = $Subquery as new<C extends SchemaMapping>() => Subquery<C>;
