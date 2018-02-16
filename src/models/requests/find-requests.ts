import { AggregateField, ColumnField, DerivedField, Field } from "../fields";
import { Filter } from "../filters";
import { Orm } from "../orms";
import { Pagination } from "../pagination";
import { SortBy } from "../sort-by";

export interface FindRequest<A = any> {
	filter?: Filter;
	auth?: A;
}

export type FindRequestField = Field | { [key: string]: Field };

export interface FindOneRequest<A = any> extends FindRequest<A> {
	fields?: FindRequestField[];
}

export type FindAllRequestSortable = ColumnField | DerivedField | AggregateField | SortBy;
export interface FindAllRequest<A = any> extends FindOneRequest<A> {
	sortBy?: FindAllRequestSortable[];
	pagination?: Pagination;
}

export interface FindCountRequest<A = any> extends FindRequest<A> {
	fields?: FindRequestField[];
}

export interface FindAllWithCountRequest<A = any> extends FindAllRequest<A> {
	parallel?: boolean;
}

export type FindOneRequestBuilder<O extends Orm, A = any> = (orm: O) => FindOneRequest<A>;
export type FindAllRequestBuilder<O extends Orm, A = any> = (orm: O) => FindAllRequest<A>;
export type FindCountRequestBuilder<O extends Orm, A = any> = (orm: O) => FindCountRequest<A>;
export type FindAllWithCountRequestBuilder<O extends Orm, A = any> = (orm: O) => FindAllWithCountRequest<A>;
