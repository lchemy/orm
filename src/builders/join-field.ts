import { List } from "immutable";

import { FieldExclusion, SortDirection } from "../enums";
import { ColumnField, DerivedField, JoinField, JoinManyField, JoinOneField, Orm, OrmRef, PartitionedJoinManyField, PluckedJoinManyField, PluckedJoinOneField, SortDirectionLike } from "../models";
import { JoinAuthFilter, JoinBuilderThrough, JoinFieldBuildersFactory, JoinFields, JoinManyPartitionTo, JoinOnFilter, JoinPluck, JoinSortBys } from "../models/fields/join-fields/join-field-types";
import { defineLazyProperty, expandFields } from "../utilities";

import { OrmDefinition, buildJoinOrmFromDefinition, buildThroughOrmFromDefinition, definitions } from "./orm";

export function makeJoinFieldBuilders<O extends Orm>(): JoinFieldBuildersFactory<O> {
	return {
		one: <J extends Orm>(join: OrmRef<J>) => new JoinOneFieldBuilder<O, J>(join),
		many: <J extends Orm>(join: OrmRef<J>) => new JoinManyFieldBuilder<O, J>(join)
	} as any;
}

export abstract class JoinFieldBuilder<O extends Orm, J extends Orm> {
	protected _on!: JoinOnFilter;
	protected _through: Array<JoinBuilderThrough<Orm>> = [];
	protected _fields?: JoinFields<J>;
	protected _auth?: JoinAuthFilter;

	constructor(protected _join: OrmRef<J>, protected _exclusivity: FieldExclusion) {
	}

	include(): this {
		this._exclusivity = FieldExclusion.INCLUDE;
		return this;
	}

	exclude(): this {
		this._exclusivity = FieldExclusion.EXCLUDE;
		return this;
	}

	through<T extends Orm>(orm: OrmRef<T>, on: JoinOnFilter): this {
		this._through.push({ orm, on });
		return this;
	}

	on(on: JoinOnFilter): this {
		this._on = on;
		return this;
	}

	fields(fields: JoinFields<J>): this {
		this._fields = fields;
		return this;
	}

	auth(auth: JoinAuthFilter): this {
		this._auth = auth;
		return this;
	}

	noAuth(): this {
		this._auth = () => true;
		return this;
	}

	abstract $build(orm: O, path: List<string>): JoinField<J>;

	protected _build(orm: O, path: List<string>, joinField: JoinField<J>): JoinField<J> {
		const props = joinField["🜁"];
		props.orm = orm;
		props.exclusivity = this._exclusivity;
		props.path = path;

		const joinDefinition = definitions.get(this._join)! as any as OrmDefinition<any, J>,
			joinOrm = buildJoinOrmFromDefinition(joinDefinition, joinField);

		const throughOrms = this._through.map((t, i) => {
			const throughDefinition = definitions.get(t.orm)!,
				throughOrm = buildThroughOrmFromDefinition(throughDefinition, joinOrm, i);
			return throughOrm;
		});

		const isJoinOne = joinField instanceof JoinOneField,
			orms = [ (isJoinOne ? orm : joinOrm), ...throughOrms, (isJoinOne ? joinOrm : orm) ],
			rawOns = [...this._through.map((t) => t.on), this._on],
			ons = rawOns.map((rawOn, i) => rawOn(...orms.slice(0, i + 2)));

		const through = throughOrms.map((throughOrm, i) => {
			return {
				orm: throughOrm,
				on: ons[i]
			};
		});

		props.join = joinOrm;
		props.on = ons[ons.length - 1];
		props.through = through;

		if (this._fields != null) {
			joinOrm["🜀"].defaultFields = expandFields(
				this._fields(joinOrm)
			);
		}

		const joinAuth = this._auth,
			{ auth: ormAuth } = definitions.get(this._join)! as any as OrmDefinition<any, J>;
		if (joinAuth != null) {
			props.auth = (a) => joinAuth(a, ...orms);
		} else if (ormAuth != null) {
			props.auth = (a) => ormAuth(a, joinOrm);
		}

		Object.keys(joinOrm).forEach((key) => {
			Object.defineProperty(joinField, key, {
				enumerable: true,
				get: () => (joinOrm as any)[key]
			});
		});

		joinOrm["🜀"].joinedBy = joinField;

		return joinField;
	}
}

export class JoinOneFieldBuilder<O extends Orm, J extends Orm> extends JoinFieldBuilder<O, J> {
	protected _optional: boolean = false;

	constructor(join: OrmRef<J>) {
		super(join, FieldExclusion.INCLUDE);
	}

	exclude(): this {
		super.exclude();
		this.optional();
		return this;
	}

	optional(): this {
		this._optional = true;
		return this;
	}

	pluck<T>(pluck: JoinPluck<J, T>): PluckedJoinOneFieldBuilder<O, J, T> {
		return new PluckedJoinOneFieldBuilder(this, pluck);
	}

	$build(orm: O, path: List<string>): JoinOneField<J> {
		const joinField = this._build(orm, path, new JoinOneField<J>()) as JoinOneField<J>,
			props = joinField["🜁"];

		props.optional = this._optional;

		return joinField;
	}
}

export class PluckedJoinOneFieldBuilder<O extends Orm, J extends Orm, T> {
	constructor(private _joinOneFieldBuilder: JoinOneFieldBuilder<O, J>, private _pluck: JoinPluck<J, T>) {
		// set fields to only the plucked field
		_joinOneFieldBuilder.fields((orm) => [_pluck(orm)]);
	}

	exclude(): this {
		this._joinOneFieldBuilder.exclude();
		return this;
	}

	optional(): this {
		this._joinOneFieldBuilder.optional();
		return this;
	}

	auth(auth: JoinAuthFilter): this {
		this._joinOneFieldBuilder.auth(auth);
		return this;
	}

	noAuth(): this {
		this._joinOneFieldBuilder.noAuth();
		return this;
	}

	$build(orm: O, path: List<string>): PluckedJoinOneField<J, T> {
		const pluckedField = new PluckedJoinOneField<J, T>(),
			props = pluckedField["🜁"],
			joinField = this._joinOneFieldBuilder.$build(orm, path),
			joinProps = joinField["🜁"],
			pluckField = this._pluck(joinProps.join);

		props.orm = orm;
		props.exclusivity = joinProps.exclusivity;
		props.path = path;
		props.pluckField = pluckField;
		props.joinField = joinField;

		joinProps.pluckedBy = pluckedField;

		return pluckedField;
	}
}

export class JoinManyFieldBuilder<O extends Orm, J extends Orm> extends JoinFieldBuilder<O, J> {
	protected _sortBy?: JoinSortBys<J>;

	constructor(join: OrmRef<J>) {
		super(join, FieldExclusion.EXCLUDE);
	}

	sortBy(sortBy: JoinSortBys<J>): this {
		this._sortBy = sortBy;
		return this;
	}

	partitionTo<K extends string>(partitionTo: JoinManyPartitionTo<J, K>): PartitionedJoinManyFieldBuilder<O, J, K> {
		return new PartitionedJoinManyFieldBuilder(this, partitionTo);
	}

	pluck<T>(pluck: JoinPluck<J, T>): PluckedJoinManyFieldBuilder<O, J, T> {
		return new PluckedJoinManyFieldBuilder(this, pluck);
	}

	$build(orm: O, path: List<string>): JoinManyField<J> {
		const joinField = this._build(orm, path, new JoinManyField<J>()) as JoinManyField<J>,
			props = joinField["🜁"];

		if (this._sortBy != null) {
			props.sortBy = this._sortBy(props.join).map((sortBy) => {
				if (sortBy instanceof ColumnField || sortBy instanceof DerivedField) {
					return {
						field: sortBy,
						direction: SortDirection.ASCENDING
					};
				} else {
					return sortBy;
				}
			});
		}

		return joinField;
	}
}

export class PartitionedJoinManyFieldBuilder<O extends Orm, J extends Orm, K extends string> {
	constructor(private _joinManyFieldBuilder: JoinManyFieldBuilder<O, J>, private _partitionTo: JoinManyPartitionTo<J, K>) {

	}

	include(): this {
		this._joinManyFieldBuilder.include();
		return this;
	}

	fields(fields: JoinFields<J>): this {
		this._joinManyFieldBuilder.fields(fields);
		return this;
	}

	auth(auth: JoinAuthFilter): this {
		this._joinManyFieldBuilder.auth(auth);
		return this;
	}

	noAuth(): this {
		this._joinManyFieldBuilder.noAuth();
		return this;
	}

	sortBy(sortBy: JoinSortBys<J>): this {
		this._joinManyFieldBuilder.sortBy(sortBy);
		return this;
	}

	$build(orm: O, path: List<string>): PartitionedJoinManyField<J, K> {
		const partitionedField = new PartitionedJoinManyField<J, K>(),
			props = partitionedField["🜁"],
			joinField = this._joinManyFieldBuilder.$build(orm, path),
			joinProps = joinField["🜁"],
			partitions = this._partitionTo(joinProps.join);

		props.orm = orm;
		props.exclusivity = joinProps.exclusivity;
		props.path = path;
		props.partitions = partitions;
		props.joinField = joinField;

		joinProps.partitionedBy = partitionedField as PartitionedJoinManyField<J, any>;

		(Object.keys(partitions) as Array<keyof typeof partitions>).forEach((key) => {
			defineLazyProperty(partitionedField, key, () => {
				// TODO: should the child join many's somehow refer to the partition and use the partition key to do something?
				// further optimization might be possible but may be a messy implementation
				const childField = this._joinManyFieldBuilder.$build(orm, path.concat(key)),
					childFilter = this._partitionTo(childField["🜁"].join)[key],
					childProps = childField["🜁"];

				childProps.on = childProps.on.and(childFilter);
				childProps.partitionedFrom = partitionedField as PartitionedJoinManyField<J, any>;
				childProps.partitionKey = key;

				return childField;
			});
		});

		defineLazyProperty(partitionedField, "$all", () => {
			return joinField;
		});

		return partitionedField;
	}
}

export class PluckedJoinManyFieldBuilder<O extends Orm, J extends Orm, T> {
	constructor(private _joinManyFieldBuilder: JoinManyFieldBuilder<O, J>, private _pluck: JoinPluck<J, T>) {
		// reset sort by
		_joinManyFieldBuilder.sortBy(() => []);

		// set fields to only the plucked field
		_joinManyFieldBuilder.fields((orm) => [_pluck(orm)]);
	}

	include(): this {
		this._joinManyFieldBuilder.include();
		return this;
	}

	auth(auth: JoinAuthFilter): this {
		this._joinManyFieldBuilder.auth(auth);
		return this;
	}

	noAuth(): this {
		this._joinManyFieldBuilder.noAuth();
		return this;
	}

	sort(sort: SortDirectionLike): this {
		this._joinManyFieldBuilder.sortBy((orm) => [{
			field: this._pluck(orm),
			direction: sort
		}]);
		return this;
	}

	$build(orm: O, path: List<string>): PluckedJoinManyField<J, T> {
		const pluckedField = new PluckedJoinManyField<J, T>(),
			props = pluckedField["🜁"],
			joinField = this._joinManyFieldBuilder.$build(orm, path),
			joinProps = joinField["🜁"],
			pluckField = this._pluck(joinProps.join);

		props.orm = orm;
		props.exclusivity = joinProps.exclusivity;
		props.path = path;
		props.pluckField = pluckField;
		props.joinField = joinField;

		joinProps.pluckedBy = pluckedField;

		return pluckedField;
	}
}
