import { Set } from "immutable";
import * as Knex from "knex";

import { Column } from "../column";

export interface SchemaMapping {
	[key: string]: Column;
}

export abstract class SchemaProperties {
	database!: Promise<Knex>;
	useFullNames!: boolean;
	primaryKey!: Set<Column>;
}
export abstract class $Schema {
	"🜃": SchemaProperties;

	constructor() {
		Object.defineProperty(this, "🜃", {
			value: {}
		});
	}

	abstract toString(): string;
}
export type Schema<S extends SchemaMapping = SchemaMapping> = $Schema & S;
// tslint:disable-next-line:variable-name
export const Schema = $Schema as new<C extends SchemaMapping>() => Schema<C>;

export class SchemaRef<S extends SchemaMapping, T extends Schema<S> = Schema<S>> {
	"🜅": T;

	constructor(target: T) {
		Object.defineProperty(this, "🜅", {
			value: target
		});
	}
}
