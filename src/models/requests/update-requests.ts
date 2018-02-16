import { ColumnField } from "../fields";
import { Filter } from "../filters";
import { Orm } from "../orms";

export interface UpdateRequest<A = any> {
	auth?: A;
}

export interface UpdateSetValue {
	field: ColumnField;
	value: any;
}
export interface UpdateWithFilterRequest<A = any> extends UpdateRequest<A> {
	filter: Filter;
	values: UpdateSetValue[];
	expected: number | null;
}

export interface UpdateManyRequest<A = any> extends UpdateRequest<A> {
	fields: ColumnField[];
	items: object[];
}

export interface UpdateOneRequest<A = any> extends UpdateRequest<A> {
	fields: ColumnField[];
	item: object;
}

export type UpdateWithFilterRequestBuilder<O extends Orm, A> = (orm: O) => UpdateWithFilterRequest<A>;
export type UpdateManyRequestBuilder<O extends Orm, A> = (orm: O) => UpdateManyRequest<A>;
export type UpdateOneRequestBuilder<O extends Orm, A> = (orm: O) => UpdateOneRequest<A>;
