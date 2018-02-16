import { Column } from "../column";
import { RelationalOrm } from "../orms";

import { FieldProperties } from "./field";
import { FilterableField } from "./filterable-field";

export type ColumnAliaser<O extends RelationalOrm, T> = (orm: O) => ColumnField<T>;

export class ColumnFieldProperties<T> extends FieldProperties {
	id!: number;

	column!: Column<T>;
	aliaser?: ColumnAliaser<RelationalOrm, T>;
	alias?: ColumnField<T>;

	get fieldName(): string {
		if (this._fieldName == null) {
			this._fieldName = `${ this.orm["🜀"].tableAs }.${ this.column.name }`;
		}
		return this._fieldName;
	}
	private _fieldName!: string;

	get fieldAs(): string {
		if (this._fieldAs == null) {
			this._fieldAs = this.orm["🜀"].schema["🜃"].useFullNames ? this.path.join("_") : `col${ this.id }`;
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

	get primary(): boolean {
		return this.column.primary;
	}
}

export class ColumnField<T = any> extends FilterableField {
	"🜁": ColumnFieldProperties<T>;

	constructor() {
		super();

		Object.defineProperty(this, "🜁", {
			value: new ColumnFieldProperties()
		});
	}
}
