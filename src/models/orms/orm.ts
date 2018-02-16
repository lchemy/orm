import { List, Set } from "immutable";

import { defineLazyProperty } from "../../utilities";
import { AggregateField, ColumnField, DerivedField, Field, JoinField } from "../fields";
import { Filter } from "../filters";
import { Schema } from "../schemas";

export abstract class OrmProperties {
	id!: number;
	definitionId!: number;

	name!: string;
	schema!: Schema;

	path!: List<string>;

	root!: Orm;
	base!: Orm;
	parent?: Orm;
	depth!: number;

	anonymous!: boolean;

	auth?: (auth: any) => Filter | boolean;

	fields: Set<Field> = Set();
	defaultFields: Set<ColumnField | DerivedField | AggregateField> = Set();
	primaryFields: Set<ColumnField> = Set();
	joinedBy?: JoinField;

	cache: Record<string, any> = {};

	get tableAs(): string {
		if (this._tableAs == null) {
			this._tableAs = this.schema["🜃"].useFullNames ? this.path.join("_") : `orm${ this.id }`;
		}
		return this._tableAs;
	}
	private _tableAs!: string;

	get tablePath(): string {
		if (this._tablePath == null) {
			this._tablePath = this.path.join("$");
		}
		return this._tablePath;
	}
	private _tablePath!: string;
}

export abstract class Orm {
	"🜀": OrmProperties;

	get $parent(): Orm | undefined {
		return this["🜀"].parent;
	}

	toString(): string {
		return this["🜀"].path.join(".");
	}
}

export class OrmRef<O extends Orm> {
	"🜅": Promise<O>;

	constructor(builder: () => O) {
		defineLazyProperty(this, "🜅", () => {
			return Promise.resolve().then(() => {
				return builder();
			});
		}, false);
	}
}
