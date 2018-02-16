import { Filter } from "../filters";
import { Orm } from "../orms";

export interface RemoveRequest<A = any> {
	auth?: A;
}

export interface RemoveWithFilterRequest<A = any> extends RemoveRequest<A> {
	filter: Filter;
	expected: number | null;
}

export interface RemoveManyRequest<A = any> extends RemoveRequest<A> {
	items: object[];
}

export interface RemoveOneRequest<A = any> extends RemoveRequest<A> {
	item: object;
}

export type RemoveWithFilterRequestBuilder<O extends Orm, A> = (orm: O) => RemoveWithFilterRequest<A>;
export type RemoveManyRequestBuilder<A> = () => RemoveManyRequest<A>;
export type RemoveOneRequestBuilder<A> = () => RemoveOneRequest<A>;
