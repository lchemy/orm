import { List } from "immutable";
import * as Knex from "knex";

import { Aggregate } from "../aggregate";
import { Column } from "../column";
import { Datum } from "../datum";

import { Field, FieldProperties } from "./field";

export class AggregateFieldProperties<T = any> extends FieldProperties {
	id!: number;

	columns!: List<Column>;
	datum!: Datum<T>;
	aggregate!: Aggregate;

	get fieldAs(): string {
		if (this._fieldAs == null) {
			this._fieldAs = this.orm["🜀"].schema["🜃"].useFullNames ? this.path.join("_") : `agg${ this.id }`;
		}
		return this._fieldAs;
	}
	private _fieldAs!: string;

	get fieldPath(): string {
		if (this._fieldPath == null) {
			this._fieldPath = this.path.join("$");
		}
		return this._fieldPath;
	}
	private _fieldPath!: string;

	getFieldSql(db: Knex | undefined): string {
		const tableAs = this.orm["🜀"].tableAs,
			measureNames = this.columns.map((column) => `${ tableAs }.${ column.name }`).toArray();
		return this.aggregate.toSql(db, ...measureNames);
	}
}

export class AggregateField<T = any> extends Field {
	"🜁": AggregateFieldProperties<T>;

	constructor() {
		super();

		Object.defineProperty(this, "🜁", {
			value: new AggregateFieldProperties<T>()
		});
	}
}
