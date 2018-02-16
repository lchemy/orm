import { Datum } from "./datum";
import { Schema } from "./schemas";

export class Column<T = any> {
	schema!: Schema;
	name!: string;
	primary: boolean = false;
	datum!: Datum<T>;

	toString(): string {
		return `${ this.schema }.${ this.name }`;
	}
}
