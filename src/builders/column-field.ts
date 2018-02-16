import { List } from "immutable";

import { FieldExclusion } from "../enums";
import { Column, ColumnAliaser, ColumnField, Orm } from "../models";

export type ColumnFieldBuilderFactory<O extends Orm> = <T>(column: Column<T>) => ColumnFieldBuilder<O, T>;

export function makeColumnFieldBuilder<O extends Orm>(): ColumnFieldBuilderFactory<O> {
	return <T>(column: Column<T>) => {
		return new ColumnFieldBuilder<O, T>(column);
	};
}

let COLUMN_FIELD_ID: number = 0;
export class ColumnFieldBuilder<O extends Orm, T> {
	private _exclusivity: FieldExclusion = FieldExclusion.INCLUDE;
	private _aliaser?: ColumnAliaser<O, T>;

	constructor(private _column: Column<T>) {
	}

	exclude(): this {
		this._exclusivity = FieldExclusion.EXCLUDE;
		return this;
	}

	alias(aliaser: ColumnAliaser<O, T>): this {
		this._aliaser = aliaser;
		return this;
	}

	$build(orm: O, path: List<string>): ColumnField<T> {
		const field = new ColumnField<T>(),
			props = field["🜁"];

		props.id = COLUMN_FIELD_ID++;
		props.orm = orm;
		props.column = this._column;
		props.exclusivity = this._exclusivity;
		props.path = path;
		props.aliaser = this._aliaser as ColumnAliaser<Orm, T> | undefined;

		return field;
	}
}
