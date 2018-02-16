import { List } from "immutable";
import * as Knex from "knex";

import { Column } from "../column";
import { Datum } from "../datum";
import { Derivative } from "../derivative";

import { FieldProperties } from "./field";
import { FilterableField } from "./filterable-field";

export class DerivedFieldProperties<T> extends FieldProperties {
	id!: number;

	columns!: List<Column>;
	datum!: Datum<T>;
	derivative!: Derivative;

	get fieldAs(): string {
		if (this._fieldAs == null) {
			this._fieldAs = this.orm["🜀"].schema["🜃"].useFullNames ? this.path.join("_") : `drvd${ this.id }`;
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

	getFieldSql(db: Knex | undefined, withPrefix: boolean = true): string {
		const columnNames = this.columns.map((column) => {
			if (withPrefix) {
				return `${ this.orm["🜀"].tableAs }.${ column.name }`;
			} else {
				return column.name;
			}
		}).toArray();
		return this.derivative.toSql(db, ...columnNames);
	}
}

export class DerivedField<T = any> extends FilterableField {
	"🜁": DerivedFieldProperties<T>;

	constructor() {
		super();

		Object.defineProperty(this, "🜁", {
			value: new DerivedFieldProperties()
		});
	}
}
