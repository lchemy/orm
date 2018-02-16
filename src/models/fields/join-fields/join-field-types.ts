import { List } from "immutable";

import { Filter } from "../../filters";
import { Orm, OrmRef } from "../../orms";
import { SortBy, SortDirectionLike } from "../../sort-by";
import { ColumnField } from "../column-field";
import { DerivedField } from "../derived-field";
import { Field } from "../field";

import { JoinManyField } from "./join-many-field";
import { JoinOneField } from "./join-one-field";
import { PartitionedJoinManyField } from "./partitioned-join-many-field";
import { PluckedJoinManyField } from "./plucked-join-many-field";
import { PluckedJoinOneField } from "./plucked-join-one-field";

export interface JoinFieldBuildersFactory<O extends Orm> {
	one: <J extends Orm>(join: OrmRef<J>) => StartJoinOneFieldBuilder<O, J>;
	many: <J extends Orm>(join: OrmRef<J>) => StartJoinManyFieldBuilder<O, J>;
}

export type JoinFields<O extends Orm> = (orm: O) => Field[];

export type JoinSortBys<O extends Orm> = (orm: O) => Array<ColumnField | DerivedField | SortBy>;

export interface JoinOn<O extends Orm> {
	orm: O;
	on: Filter | boolean;
}

export interface JoinBuilderThrough<O extends Orm> {
	orm: OrmRef<O>;
	on: JoinOnFilter;
}

export type JoinManyPartitions<K extends string> = {
	[key in K]: Filter;
};

export type JoinManyPartitionTo<O extends Orm, K extends string> = (orm: O) => JoinManyPartitions<K>;

export type JoinPluck<O extends Orm, T> = (orm: O) => ColumnField<T> | DerivedField<T>;

export type JoinOnFilter = (...orms: Orm[]) => Filter;
export type JoinOnFilter2<M1 extends Orm, M2 extends Orm> = (o1: M1, o2: M2) => Filter;
export type JoinOnFilter3<M1 extends Orm, M2 extends Orm, M3 extends Orm> = (o1: M1, o2: M2, o3: M3) => Filter;
export type JoinOnFilter4<M1 extends Orm, M2 extends Orm, M3 extends Orm, M4 extends Orm> = (o1: M1, o2: M2, o3: M3, o4: M4) => Filter;
export type JoinOnFilter5<M1 extends Orm, M2 extends Orm, M3 extends Orm, M4 extends Orm, M5 extends Orm> = (o1: M1, o2: M2, o3: M3, o4: M4, o5: M5) => Filter;
export type JoinOnFilter6<M1 extends Orm, M2 extends Orm, M3 extends Orm, M4 extends Orm, M5 extends Orm, M6 extends Orm> = (o1: M1, o2: M2, o3: M3, o4: M4, o5: M5, o6: M6) => Filter;
export type JoinOnFilter7<M1 extends Orm, M2 extends Orm, M3 extends Orm, M4 extends Orm, M5 extends Orm, M6 extends Orm, M7 extends Orm> = (o1: M1, o2: M2, o3: M3, o4: M4, o5: M5, o6: M6, o7: M7) => Filter;
export type JoinOnFilter8<M1 extends Orm, M2 extends Orm, M3 extends Orm, M4 extends Orm, M5 extends Orm, M6 extends Orm, M7 extends Orm, M8 extends Orm> = (o1: M1, o2: M2, o3: M3, o4: M4, o5: M5, o6: M6, o7: M7, o8: M8) => Filter;

export type JoinAuthFilter = (auth: any, ...orms: Orm[]) => Filter | boolean;
export type JoinAuthFilter2<M1 extends Orm, M2 extends Orm> = (auth: any, o1: M1, o2: M2) => Filter | boolean;
export type JoinAuthFilter3<M1 extends Orm, M2 extends Orm, M3 extends Orm> = (auth: any, o1: M1, o2: M2, o3: M3) => Filter | boolean;
export type JoinAuthFilter4<M1 extends Orm, M2 extends Orm, M3 extends Orm, M4 extends Orm> = (auth: any, o1: M1, o2: M2, o3: M3, o4: M4) => Filter | boolean;
export type JoinAuthFilter5<M1 extends Orm, M2 extends Orm, M3 extends Orm, M4 extends Orm, M5 extends Orm> = (auth: any, o1: M1, o2: M2, o3: M3, o4: M4, o5: M5) => Filter | boolean;
export type JoinAuthFilter6<M1 extends Orm, M2 extends Orm, M3 extends Orm, M4 extends Orm, M5 extends Orm, M6 extends Orm> = (auth: any, o1: M1, o2: M2, o3: M3, o4: M4, o5: M5, o6: M6) => Filter | boolean;
export type JoinAuthFilter7<M1 extends Orm, M2 extends Orm, M3 extends Orm, M4 extends Orm, M5 extends Orm, M6 extends Orm, M7 extends Orm> = (auth: any, o1: M1, o2: M2, o3: M3, o4: M4, o5: M5, o6: M6, o7: M7) => Filter | boolean;
export type JoinAuthFilter8<M1 extends Orm, M2 extends Orm, M3 extends Orm, M4 extends Orm, M5 extends Orm, M6 extends Orm, M7 extends Orm, M8 extends Orm> = (auth: any, o1: M1, o2: M2, o3: M3, o4: M4, o5: M5, o6: M6, o7: M7, o8: M8) => Filter | boolean;

export interface JoinOneFieldBuilder<O extends Orm, J extends Orm> {
	auth(auth: JoinAuthFilter): this;
	noAuth(): this;
	fields(fields: JoinFields<J>): this;
	optional(): this;
	$build(orm: O, path: List<string>): JoinOneField<J>;
}
export type StartJoinOneFieldBuilder<O extends Orm, J extends Orm> = StartJoinOneFieldBuilder2<O, J>;
export interface BaseJoinOneFieldBuilder {
	exclude(): this;
	optional(): this;
}
export interface StartJoinOneFieldBuilder2<O extends Orm, J extends Orm> extends BaseJoinOneFieldBuilder {
	through<T1 extends Orm>(orm: OrmRef<T1>, on: JoinOnFilter2<O, T1>): StartJoinOneFieldBuilder3<O, T1, J>;
	on(on: JoinOnFilter2<O, J>): EndJoinOneFieldBuilder2<O, J>;
}
export interface EndJoinOneFieldBuilder2<O extends Orm, J extends Orm> extends BaseJoinOneFieldBuilder {
	auth(auth: JoinAuthFilter2<O, J>): this;
	noAuth(): this;
	fields(fields: JoinFields<J>): this;
	pluck<T>(pluck: JoinPluck<J, T>): PluckedJoinOneFieldBuilder2<O, J, T>;
	$build(orm: O, path: List<string>): JoinOneField<J>;
}
export interface StartJoinOneFieldBuilder3<O extends Orm, T1 extends Orm, J extends Orm> extends BaseJoinOneFieldBuilder {
	through<T2 extends Orm>(orm: OrmRef<T2>, on: JoinOnFilter3<O, T1, T2>): StartJoinOneFieldBuilder4<O, T1, T2, J>;
	on(on: JoinOnFilter3<O, T1, J>): EndJoinOneFieldBuilder3<O, T1, J>;
}
export interface EndJoinOneFieldBuilder3<O extends Orm, T1 extends Orm, J extends Orm> extends BaseJoinOneFieldBuilder {
	auth(auth: JoinAuthFilter3<O, T1, J>): this;
	noAuth(): this;
	fields(fields: JoinFields<J>): this;
	pluck<T>(pluck: JoinPluck<J, T>): PluckedJoinOneFieldBuilder3<O, T1, J, T>;
	$build(orm: O, path: List<string>): JoinOneField<J>;
}
export interface StartJoinOneFieldBuilder4<O extends Orm, T1 extends Orm, T2 extends Orm, J extends Orm> extends BaseJoinOneFieldBuilder {
	through<T3 extends Orm>(orm: OrmRef<T3>, on: JoinOnFilter4<O, T1, T2, T3>): StartJoinOneFieldBuilder5<O, T1, T2, T3, J>;
	on(on: JoinOnFilter4<O, T1, T2, J>): EndJoinOneFieldBuilder4<O, T1, T2, J>;
}
export interface EndJoinOneFieldBuilder4<O extends Orm, T1 extends Orm, T2 extends Orm, J extends Orm> extends BaseJoinOneFieldBuilder {
	auth(auth: JoinAuthFilter4<O, T1, T2, J>): this;
	noAuth(): this;
	fields(fields: JoinFields<J>): this;
	pluck<T>(pluck: JoinPluck<J, T>): PluckedJoinOneFieldBuilder4<O, T1, T2, J, T>;
	$build(orm: O, path: List<string>): JoinOneField<J>;
}
export interface StartJoinOneFieldBuilder5<O extends Orm, T1 extends Orm, T2 extends Orm, T3 extends Orm, J extends Orm> extends BaseJoinOneFieldBuilder {
	through<T4 extends Orm>(orm: OrmRef<T4>, on: JoinOnFilter5<O, T1, T2, T3, T4>): StartJoinOneFieldBuilder6<O, T1, T2, T3, T4, J>;
	on(on: JoinOnFilter5<O, T1, T2, T3, J>): EndJoinOneFieldBuilder5<O, T1, T2, T3, J>;
}
export interface EndJoinOneFieldBuilder5<O extends Orm, T1 extends Orm, T2 extends Orm, T3 extends Orm, J extends Orm> extends BaseJoinOneFieldBuilder {
	auth(auth: JoinAuthFilter5<O, T1, T2, T3, J>): this;
	noAuth(): this;
	fields(fields: JoinFields<J>): this;
	pluck<T>(pluck: JoinPluck<J, T>): PluckedJoinOneFieldBuilder5<O, T1, T2, T3, J, T>;
	$build(orm: O, path: List<string>): JoinOneField<J>;
}
export interface StartJoinOneFieldBuilder6<O extends Orm, T1 extends Orm, T2 extends Orm, T3 extends Orm, T4 extends Orm, J extends Orm> extends BaseJoinOneFieldBuilder {
	through<T5 extends Orm>(orm: OrmRef<T5>, on: JoinOnFilter6<O, T1, T2, T3, T4, T5>): StartJoinOneFieldBuilder7<O, T1, T2, T3, T4, T5, J>;
	on(on: JoinOnFilter6<O, T1, T2, T3, T4, J>): EndJoinOneFieldBuilder6<O, T1, T2, T3, T4, J>;
}
export interface EndJoinOneFieldBuilder6<O extends Orm, T1 extends Orm, T2 extends Orm, T3 extends Orm, T4 extends Orm, J extends Orm> extends BaseJoinOneFieldBuilder {
	auth(auth: JoinAuthFilter6<O, T1, T2, T3, T4, J>): this;
	noAuth(): this;
	fields(fields: JoinFields<J>): this;
	pluck<T>(pluck: JoinPluck<J, T>): PluckedJoinOneFieldBuilder6<O, T1, T2, T3, T4, J, T>;
	$build(orm: O, path: List<string>): JoinOneField<J>;
}
export interface StartJoinOneFieldBuilder7<O extends Orm, T1 extends Orm, T2 extends Orm, T3 extends Orm, T4 extends Orm, T5 extends Orm, J extends Orm> extends BaseJoinOneFieldBuilder {
	through<T6 extends Orm>(orm: OrmRef<T6>, on: JoinOnFilter7<O, T1, T2, T3, T4, T5, T6>): StartJoinOneFieldBuilder8<O, T1, T2, T3, T4, T5, T6, J>;
	on(on: JoinOnFilter7<O, T1, T2, T3, T4, T5, J>): EndJoinOneFieldBuilder7<O, T1, T2, T3, T4, T5, J>;
}
export interface EndJoinOneFieldBuilder7<O extends Orm, T1 extends Orm, T2 extends Orm, T3 extends Orm, T4 extends Orm, T5 extends Orm, J extends Orm> extends BaseJoinOneFieldBuilder {
	auth(auth: JoinAuthFilter7<O, T1, T2, T3, T4, T5, J>): this;
	noAuth(): this;
	fields(fields: JoinFields<J>): this;
	pluck<T>(pluck: JoinPluck<J, T>): PluckedJoinOneFieldBuilder7<O, T1, T2, T3, T4, T5, J, T>;
	$build(orm: O, path: List<string>): JoinOneField<J>;
}
export interface StartJoinOneFieldBuilder8<O extends Orm, T1 extends Orm, T2 extends Orm, T3 extends Orm, T4 extends Orm, T5 extends Orm, T6 extends Orm, J extends Orm> extends BaseJoinOneFieldBuilder {
	on(on: JoinOnFilter8<O, T1, T2, T3, T4, T5, T6, J>): EndJoinOneFieldBuilder8<O, T1, T2, T3, T4, T5, T6, J>;
}
export interface EndJoinOneFieldBuilder8<O extends Orm, T1 extends Orm, T2 extends Orm, T3 extends Orm, T4 extends Orm, T5 extends Orm, T6 extends Orm, J extends Orm> extends BaseJoinOneFieldBuilder {
	auth(auth: JoinAuthFilter8<O, T1, T2, T3, T4, T5, T6, J>): this;
	noAuth(): this;
	fields(fields: JoinFields<J>): this;
	pluck<T>(pluck: JoinPluck<J, T>): PluckedJoinOneFieldBuilder8<O, T1, T2, T3, T4, T5, T6, J, T>;
	$build(orm: O, path: List<string>): JoinOneField<J>;
}

export interface PluckedJoinOneFieldBuilder<O extends Orm, J extends Orm, T> {
	exclude(): this;
	optional(): this;
	auth(auth: JoinAuthFilter): this;
	noAuth(): this;
	$build(orm: O, path: List<string>): PluckedJoinOneField<J, T>;
}
export interface PluckedJoinOneFieldBuilder2<O extends Orm, J extends Orm, T> {
	exclude(): this;
	optional(): this;
	auth(auth: JoinAuthFilter2<J, O>): this;
	noAuth(): this;
	$build(orm: O, path: List<string>): PluckedJoinOneField<J, T>;
}
export interface PluckedJoinOneFieldBuilder3<O extends Orm, T1 extends Orm, J extends Orm, T> {
	exclude(): this;
	optional(): this;
	auth(auth: JoinAuthFilter3<J, T1, O>): this;
	noAuth(): this;
	$build(orm: O, path: List<string>): PluckedJoinOneField<J, T>;
}
export interface PluckedJoinOneFieldBuilder4<O extends Orm, T1 extends Orm, T2 extends Orm, J extends Orm, T> {
	exclude(): this;
	optional(): this;
	auth(auth: JoinAuthFilter4<J, T1, T2, O>): this;
	noAuth(): this;
	$build(orm: O, path: List<string>): PluckedJoinOneField<J, T>;
}
export interface PluckedJoinOneFieldBuilder5<O extends Orm, T1 extends Orm, T2 extends Orm, T3 extends Orm, J extends Orm, T> {
	exclude(): this;
	optional(): this;
	auth(auth: JoinAuthFilter5<J, T1, T2, T3, O>): this;
	noAuth(): this;
	$build(orm: O, path: List<string>): PluckedJoinOneField<J, T>;
}
export interface PluckedJoinOneFieldBuilder6<O extends Orm, T1 extends Orm, T2 extends Orm, T3 extends Orm, T4 extends Orm, J extends Orm, T> {
	exclude(): this;
	optional(): this;
	auth(auth: JoinAuthFilter6<J, T1, T2, T3, T4, O>): this;
	noAuth(): this;
	$build(orm: O, path: List<string>): PluckedJoinOneField<J, T>;
}
export interface PluckedJoinOneFieldBuilder7<O extends Orm, T1 extends Orm, T2 extends Orm, T3 extends Orm, T4 extends Orm, T5 extends Orm, J extends Orm, T> {
	exclude(): this;
	optional(): this;
	auth(auth: JoinAuthFilter7<J, T1, T2, T3, T4, T5, O>): this;
	noAuth(): this;
	$build(orm: O, path: List<string>): PluckedJoinOneField<J, T>;
}
export interface PluckedJoinOneFieldBuilder8<O extends Orm, T1 extends Orm, T2 extends Orm, T3 extends Orm, T4 extends Orm, T5 extends Orm, T6 extends Orm, J extends Orm, T> {
	exclude(): this;
	optional(): this;
	auth(auth: JoinAuthFilter8<J, T1, T2, T3, T4, T5, T6, O>): this;
	noAuth(): this;
	$build(orm: O, path: List<string>): PluckedJoinOneField<J, T>;
}

export interface JoinManyFieldBuilder<O extends Orm, J extends Orm> extends BaseJoinManyFieldBuilder {
	auth(auth: JoinAuthFilter): this;
	noAuth(): this;
	fields(fields: JoinFields<J>): this;
	sortBy(sortBy: JoinSortBys<J>): this;
	$build(orm: O, path: List<string>): JoinManyField<J>;
}
export type StartJoinManyFieldBuilder<O extends Orm, J extends Orm> = StartJoinManyFieldBuilder2<O, J>;
export interface BaseJoinManyFieldBuilder {
	include(): this;
}
export interface StartJoinManyFieldBuilder2<O extends Orm, J extends Orm> extends BaseJoinManyFieldBuilder {
	through<T1 extends Orm>(orm: OrmRef<T1>, on: JoinOnFilter2<J, T1>): StartJoinManyFieldBuilder3<O, T1, J>;
	on(on: JoinOnFilter2<J, O>): EndJoinManyFieldBuilder2<O, J>;
}
export interface EndJoinManyFieldBuilder2<O extends Orm, J extends Orm> extends BaseJoinManyFieldBuilder {
	auth(auth: JoinAuthFilter2<J, O>): this;
	noAuth(): this;
	fields(fields: JoinFields<J>): this;
	sortBy(sortBy: JoinSortBys<J>): this;
	partitionTo<K extends string>(partitionTo: JoinManyPartitionTo<J, K>): PartitionedJoinManyFieldBuilder2<O, J, K>;
	pluck<T>(pluck: JoinPluck<J, T>): PluckedJoinManyFieldBuilder2<O, J, T>;
	$build(orm: O, path: List<string>): JoinManyField<J>;
}
export interface StartJoinManyFieldBuilder3<O extends Orm, T1 extends Orm, J extends Orm> extends BaseJoinManyFieldBuilder {
	through<T2 extends Orm>(orm: OrmRef<T2>, on: JoinOnFilter3<J, T1, T2>): StartJoinManyFieldBuilder4<O, T1, T2, J>;
	on(on: JoinOnFilter3<J, T1, O>): EndJoinManyFieldBuilder3<O, T1, J>;
}
export interface EndJoinManyFieldBuilder3<O extends Orm, T1 extends Orm, J extends Orm> extends BaseJoinManyFieldBuilder {
	auth(auth: JoinAuthFilter3<J, T1, O>): this;
	noAuth(): this;
	fields(fields: JoinFields<J>): this;
	sortBy(sortBy: JoinSortBys<J>): this;
	partitionTo<K extends string>(partitionTo: JoinManyPartitionTo<J, K>): PartitionedJoinManyFieldBuilder3<O, T1, J, K>;
	pluck<T>(pluck: JoinPluck<J, T>): PluckedJoinManyFieldBuilder3<O, T1, J, T>;
	$build(orm: O, path: List<string>): JoinManyField<J>;
}
export interface StartJoinManyFieldBuilder4<O extends Orm, T1 extends Orm, T2 extends Orm, J extends Orm> extends BaseJoinManyFieldBuilder {
	through<T3 extends Orm>(orm: OrmRef<T3>, on: JoinOnFilter4<J, T1, T2, T3>): StartJoinManyFieldBuilder5<O, T1, T2, T3, J>;
	on(on: JoinOnFilter4<J, T1, T2, O>): EndJoinManyFieldBuilder4<O, T1, T2, J>;
}
export interface EndJoinManyFieldBuilder4<O extends Orm, T1 extends Orm, T2 extends Orm, J extends Orm> extends BaseJoinManyFieldBuilder {
	auth(auth: JoinAuthFilter4<J, T1, T2, O>): this;
	noAuth(): this;
	fields(fields: JoinFields<J>): this;
	sortBy(sortBy: JoinSortBys<J>): this;
	partitionTo<K extends string>(partitionTo: JoinManyPartitionTo<J, K>): PartitionedJoinManyFieldBuilder4<O, T1, T2, J, K>;
	pluck<T>(pluck: JoinPluck<J, T>): PluckedJoinManyFieldBuilder4<O, T1, T2, J, T>;
	$build(orm: O, path: List<string>): JoinManyField<J>;
}
export interface StartJoinManyFieldBuilder5<O extends Orm, T1 extends Orm, T2 extends Orm, T3 extends Orm, J extends Orm> extends BaseJoinManyFieldBuilder {
	through<T4 extends Orm>(orm: OrmRef<T4>, on: JoinOnFilter5<J, T1, T2, T3, T4>): StartJoinManyFieldBuilder6<O, T1, T2, T3, T4, J>;
	on(on: JoinOnFilter5<J, T1, T2, T3, O>): EndJoinManyFieldBuilder5<O, T1, T2, T3, J>;
}
export interface EndJoinManyFieldBuilder5<O extends Orm, T1 extends Orm, T2 extends Orm, T3 extends Orm, J extends Orm> extends BaseJoinManyFieldBuilder {
	auth(auth: JoinAuthFilter5<J, T1, T2, T3, O>): this;
	noAuth(): this;
	fields(fields: JoinFields<J>): this;
	sortBy(sortBy: JoinSortBys<J>): this;
	partitionTo<K extends string>(partitionTo: JoinManyPartitionTo<J, K>): PartitionedJoinManyFieldBuilder5<O, T1, T2, T3, J, K>;
	pluck<T>(pluck: JoinPluck<J, T>): PluckedJoinManyFieldBuilder5<O, T1, T2, T3, J, T>;
	$build(orm: O, path: List<string>): JoinManyField<J>;
}
export interface StartJoinManyFieldBuilder6<O extends Orm, T1 extends Orm, T2 extends Orm, T3 extends Orm, T4 extends Orm, J extends Orm> extends BaseJoinManyFieldBuilder {
	through<T5 extends Orm>(orm: OrmRef<T5>, on: JoinOnFilter6<J, T1, T2, T3, T4, T5>): StartJoinManyFieldBuilder7<O, T1, T2, T3, T4, T5, J>;
	on(on: JoinOnFilter6<J, T1, T2, T3, T4, O>): EndJoinManyFieldBuilder6<O, T1, T2, T3, T4, J>;
}
export interface EndJoinManyFieldBuilder6<O extends Orm, T1 extends Orm, T2 extends Orm, T3 extends Orm, T4 extends Orm, J extends Orm> extends BaseJoinManyFieldBuilder {
	auth(auth: JoinAuthFilter6<J, T1, T2, T3, T4, O>): this;
	noAuth(): this;
	fields(fields: JoinFields<J>): this;
	sortBy(sortBy: JoinSortBys<J>): this;
	partitionTo<K extends string>(partitionTo: JoinManyPartitionTo<J, K>): PartitionedJoinManyFieldBuilder6<O, T1, T2, T3, T4, J, K>;
	pluck<T>(pluck: JoinPluck<J, T>): PluckedJoinManyFieldBuilder6<O, T1, T2, T3, T4, J, T>;
	$build(orm: O, path: List<string>): JoinManyField<J>;
}
export interface StartJoinManyFieldBuilder7<O extends Orm, T1 extends Orm, T2 extends Orm, T3 extends Orm, T4 extends Orm, T5 extends Orm, J extends Orm> extends BaseJoinManyFieldBuilder {
	through<T6 extends Orm>(orm: OrmRef<T6>, on: JoinOnFilter7<J, T1, T2, T3, T4, T5, T6>): StartJoinManyFieldBuilder8<O, T1, T2, T3, T4, T5, T6, J>;
	on(on: JoinOnFilter7<J, T1, T2, T3, T4, T5, O>): EndJoinManyFieldBuilder7<O, T1, T2, T3, T4, T5, J>;
}
export interface EndJoinManyFieldBuilder7<O extends Orm, T1 extends Orm, T2 extends Orm, T3 extends Orm, T4 extends Orm, T5 extends Orm, J extends Orm> extends BaseJoinManyFieldBuilder {
	auth(auth: JoinAuthFilter7<J, T1, T2, T3, T4, T5, O>): this;
	noAuth(): this;
	fields(fields: JoinFields<J>): this;
	sortBy(sortBy: JoinSortBys<J>): this;
	partitionTo<K extends string>(partitionTo: JoinManyPartitionTo<J, K>): PartitionedJoinManyFieldBuilder7<O, T1, T2, T3, T4, T5, J, K>;
	pluck<T>(pluck: JoinPluck<J, T>): PluckedJoinManyFieldBuilder7<O, T1, T2, T3, T4, T5, J, T>;
	$build(orm: O, path: List<string>): JoinManyField<J>;
}
export interface StartJoinManyFieldBuilder8<O extends Orm, T1 extends Orm, T2 extends Orm, T3 extends Orm, T4 extends Orm, T5 extends Orm, T6 extends Orm, J extends Orm> extends BaseJoinManyFieldBuilder {
	on(on: JoinOnFilter8<J, T1, T2, T3, T4, T5, T6, O>): EndJoinManyFieldBuilder8<O, T1, T2, T3, T4, T5, T6, J>;
}
export interface EndJoinManyFieldBuilder8<O extends Orm, T1 extends Orm, T2 extends Orm, T3 extends Orm, T4 extends Orm, T5 extends Orm, T6 extends Orm, J extends Orm> extends BaseJoinManyFieldBuilder {
	auth(auth: JoinAuthFilter8<J, T1, T2, T3, T4, T5, T6, O>): this;
	noAuth(): this;
	fields(fields: JoinFields<J>): this;
	sortBy(sortBy: JoinSortBys<J>): this;
	partitionTo<K extends string>(partitionTo: JoinManyPartitionTo<J, K>): PartitionedJoinManyFieldBuilder8<O, T1, T2, T3, T4, T5, T6, J, K>;
	pluck<T>(pluck: JoinPluck<J, T>): PluckedJoinManyFieldBuilder8<O, T1, T2, T3, T4, T5, T6, J, T>;
	$build(orm: O, path: List<string>): JoinManyField<J>;
}

export interface PartitionedJoinManyFieldBuilder<O extends Orm, J extends Orm, K extends string> {
	include(): this;
	auth(auth: JoinAuthFilter): this;
	noAuth(): this;
	fields(fields: JoinFields<J>): this;
	sortBy(sortBy: JoinSortBys<J>): this;
	$build(orm: O, path: List<string>): PartitionedJoinManyField<J, K>;
}
export interface PartitionedJoinManyFieldBuilder2<O extends Orm, J extends Orm, K extends string> {
	include(): this;
	auth(auth: JoinAuthFilter2<J, O>): this;
	noAuth(): this;
	fields(fields: JoinFields<J>): this;
	sortBy(sortBy: JoinSortBys<J>): this;
	$build(orm: O, path: List<string>): PartitionedJoinManyField<J, K>;
}
export interface PartitionedJoinManyFieldBuilder3<O extends Orm, T1 extends Orm, J extends Orm, K extends string> {
	include(): this;
	auth(auth: JoinAuthFilter3<J, T1, O>): this;
	noAuth(): this;
	fields(fields: JoinFields<J>): this;
	sortBy(sortBy: JoinSortBys<J>): this;
	$build(orm: O, path: List<string>): PartitionedJoinManyField<J, K>;
}
export interface PartitionedJoinManyFieldBuilder4<O extends Orm, T1 extends Orm, T2 extends Orm, J extends Orm, K extends string> {
	include(): this;
	auth(auth: JoinAuthFilter4<J, T1, T2, O>): this;
	noAuth(): this;
	fields(fields: JoinFields<J>): this;
	sortBy(sortBy: JoinSortBys<J>): this;
	$build(orm: O, path: List<string>): PartitionedJoinManyField<J, K>;
}
export interface PartitionedJoinManyFieldBuilder5<O extends Orm, T1 extends Orm, T2 extends Orm, T3 extends Orm, J extends Orm, K extends string> {
	include(): this;
	auth(auth: JoinAuthFilter5<J, T1, T2, T3, O>): this;
	noAuth(): this;
	fields(fields: JoinFields<J>): this;
	sortBy(sortBy: JoinSortBys<J>): this;
	$build(orm: O, path: List<string>): PartitionedJoinManyField<J, K>;
}
export interface PartitionedJoinManyFieldBuilder6<O extends Orm, T1 extends Orm, T2 extends Orm, T3 extends Orm, T4 extends Orm, J extends Orm, K extends string> {
	include(): this;
	auth(auth: JoinAuthFilter6<J, T1, T2, T3, T4, O>): this;
	noAuth(): this;
	fields(fields: JoinFields<J>): this;
	sortBy(sortBy: JoinSortBys<J>): this;
	$build(orm: O, path: List<string>): PartitionedJoinManyField<J, K>;
}
export interface PartitionedJoinManyFieldBuilder7<O extends Orm, T1 extends Orm, T2 extends Orm, T3 extends Orm, T4 extends Orm, T5 extends Orm, J extends Orm, K extends string> {
	include(): this;
	auth(auth: JoinAuthFilter7<J, T1, T2, T3, T4, T5, O>): this;
	noAuth(): this;
	fields(fields: JoinFields<J>): this;
	sortBy(sortBy: JoinSortBys<J>): this;
	$build(orm: O, path: List<string>): PartitionedJoinManyField<J, K>;
}
export interface PartitionedJoinManyFieldBuilder8<O extends Orm, T1 extends Orm, T2 extends Orm, T3 extends Orm, T4 extends Orm, T5 extends Orm, T6 extends Orm, J extends Orm, K extends string> {
	include(): this;
	auth(auth: JoinAuthFilter8<J, T1, T2, T3, T4, T5, T6, O>): this;
	noAuth(): this;
	fields(fields: JoinFields<J>): this;
	sortBy(sortBy: JoinSortBys<J>): this;
	$build(orm: O, path: List<string>): PartitionedJoinManyField<J, K>;
}


export interface PluckedJoinManyFieldBuilder<O extends Orm, J extends Orm, T> {
	include(): this;
	auth(auth: JoinAuthFilter): this;
	noAuth(): this;
	sort(sort: SortDirectionLike): this;
	$build(orm: O, path: List<string>): PluckedJoinManyField<J, T>;
}
export interface PluckedJoinManyFieldBuilder2<O extends Orm, J extends Orm, T> {
	include(): this;
	auth(auth: JoinAuthFilter2<J, O>): this;
	noAuth(): this;
	sort(sort: SortDirectionLike): this;
	$build(orm: O, path: List<string>): PluckedJoinManyField<J, T>;
}
export interface PluckedJoinManyFieldBuilder3<O extends Orm, T1 extends Orm, J extends Orm, T> {
	include(): this;
	auth(auth: JoinAuthFilter3<J, T1, O>): this;
	noAuth(): this;
	sort(sort: SortDirectionLike): this;
	$build(orm: O, path: List<string>): PluckedJoinManyField<J, T>;
}
export interface PluckedJoinManyFieldBuilder4<O extends Orm, T1 extends Orm, T2 extends Orm, J extends Orm, T> {
	include(): this;
	auth(auth: JoinAuthFilter4<J, T1, T2, O>): this;
	noAuth(): this;
	sort(sort: SortDirectionLike): this;
	$build(orm: O, path: List<string>): PluckedJoinManyField<J, T>;
}
export interface PluckedJoinManyFieldBuilder5<O extends Orm, T1 extends Orm, T2 extends Orm, T3 extends Orm, J extends Orm, T> {
	include(): this;
	auth(auth: JoinAuthFilter5<J, T1, T2, T3, O>): this;
	noAuth(): this;
	sort(sort: SortDirectionLike): this;
	$build(orm: O, path: List<string>): PluckedJoinManyField<J, T>;
}
export interface PluckedJoinManyFieldBuilder6<O extends Orm, T1 extends Orm, T2 extends Orm, T3 extends Orm, T4 extends Orm, J extends Orm, T> {
	include(): this;
	auth(auth: JoinAuthFilter6<J, T1, T2, T3, T4, O>): this;
	noAuth(): this;
	sort(sort: SortDirectionLike): this;
	$build(orm: O, path: List<string>): PluckedJoinManyField<J, T>;
}
export interface PluckedJoinManyFieldBuilder7<O extends Orm, T1 extends Orm, T2 extends Orm, T3 extends Orm, T4 extends Orm, T5 extends Orm, J extends Orm, T> {
	include(): this;
	auth(auth: JoinAuthFilter7<J, T1, T2, T3, T4, T5, O>): this;
	noAuth(): this;
	sort(sort: SortDirectionLike): this;
	$build(orm: O, path: List<string>): PluckedJoinManyField<J, T>;
}
export interface PluckedJoinManyFieldBuilder8<O extends Orm, T1 extends Orm, T2 extends Orm, T3 extends Orm, T4 extends Orm, T5 extends Orm, T6 extends Orm, J extends Orm, T> {
	include(): this;
	auth(auth: JoinAuthFilter8<J, T1, T2, T3, T4, T5, T6, O>): this;
	noAuth(): this;
	sort(sort: SortDirectionLike): this;
	$build(orm: O, path: List<string>): PluckedJoinManyField<J, T>;
}
