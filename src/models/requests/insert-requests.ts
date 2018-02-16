import { ColumnField } from "../fields";
import { Orm } from "../orms";

export interface InsertRequest {
	fields: ColumnField[];
}

export interface InsertManyRequest extends InsertRequest {
	items: object[];
}

export interface InsertOneRequest extends InsertRequest {
	item: object;
}

export type InsertManyRequestBuilder<O extends Orm> = (orm: O) => InsertManyRequest;
export type InsertOneRequestBuilder<O extends Orm> = (orm: O) => InsertOneRequest;
