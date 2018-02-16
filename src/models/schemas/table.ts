import { $Schema, SchemaMapping, SchemaProperties } from "./schema";

export class TableProperties extends SchemaProperties {
	table!: string;
}
export class $Table extends $Schema {
	"🜃": TableProperties;

	constructor() {
		super();

		Object.defineProperty(this, "🜁", {
			value: new TableProperties()
		});
	}

	toString(): string {
		return this["🜃"].table;
	}
}
export type Table<S extends SchemaMapping = SchemaMapping> = $Table & S;
// tslint:disable-next-line:variable-name
export const Table = $Table as new<C extends SchemaMapping>() => Table<C>;
