import { BigNumber } from "bignumber.js";
import { List } from "immutable";
import { LocalTime } from "js-joda";

import { FieldExclusion } from "../enums";
import {
	Aggregate,
	AggregateField,
	AggregateSql,
	Column,
	Datum,
	Orm,
	averageAggregate,
	averageDistinctAggregate,
	bigIntDatum,
	binaryDatum,
	booleanDatum,
	countAggregate,
	countDistinctAggregate,
	dateDatum,
	dateTimeDatum,
	decimalDatum,
	enumDatum,
	floatDatum,
	intDatum,
	maxAggregate,
	minAggregate,
	stringDatum,
	sumAggregate,
	timeDatum
} from "../models";

export interface AggregateFieldBuilderFactory<O extends Orm> {
	(): StartAggregateFieldBuilder<O>;
	(column1: Column, ...columns: Column[]): StartAggregateFieldWithColumnsBuilder<O>;
}

export function makeAggregateFieldBuilder<O extends Orm>(): AggregateFieldBuilderFactory<O> {
	return (...columns: Column[]) => {
		return new AggregateFieldBuilder<O, any>(columns);
	};
}

export interface StartAggregateFieldBuilder<O extends Orm> {
	count(): MidAggregateFieldBuilder<O>;
	countDistinct(): MidAggregateFieldBuilder<O>;
	with(aggregate: Aggregate | AggregateSql): MidAggregateFieldBuilder<O>;
}

export interface StartAggregateFieldWithColumnsBuilder<O extends Orm> extends StartAggregateFieldBuilder<O> {
	min(): MidAggregateFieldBuilder<O>;
	max(): MidAggregateFieldBuilder<O>;
	sum(): MidAggregateFieldBuilder<O>;
	average(): MidAggregateFieldBuilder<O>;
	averageDistinct(): MidAggregateFieldBuilder<O>;
}

export interface MidAggregateFieldBuilder<O extends Orm> {
	asBoolean(): EndAggregateFieldBuilder<O, boolean>;
	asEnum(): EndAggregateFieldBuilder<O, string>;
	asString(): EndAggregateFieldBuilder<O, string>;
	asBinary(): EndAggregateFieldBuilder<O, Buffer>;
	asInt(): EndAggregateFieldBuilder<O, number>;
	asFloat(): EndAggregateFieldBuilder<O, number>;
	asBigInt(): EndAggregateFieldBuilder<O, BigNumber>;
	asDecimal(): EndAggregateFieldBuilder<O, BigNumber>;
	asDate(): EndAggregateFieldBuilder<O, Date>;
	asDateTime(): EndAggregateFieldBuilder<O, Date>;
	asTime(): EndAggregateFieldBuilder<O, LocalTime>;
}

export interface EndAggregateFieldBuilder<O extends Orm, T> {
	include(): this;

	$build(orm: O, path: List<string>): AggregateField<T>;
}

let AGGREGATE_FIELD_ID: number = 0;
export class AggregateFieldBuilder<O extends Orm, T> implements StartAggregateFieldWithColumnsBuilder<O>, MidAggregateFieldBuilder<O>, EndAggregateFieldBuilder<O, T> {
	private _exclusivity: FieldExclusion = FieldExclusion.EXCLUDE;
	private _aggregate!: Aggregate;
	private _datum!: Datum;

	constructor(private _columns: Column[]) {

	}

	include(): this {
		this._exclusivity = FieldExclusion.INCLUDE;
		return this;
	}

	count(): this {
		this._aggregate = countAggregate;
		return this;
	}
	countDistinct(): this {
		this._aggregate = countDistinctAggregate;
		return this;
	}
	min(): this {
		this._aggregate = minAggregate;
		return this;
	}
	max(): this {
		this._aggregate = maxAggregate;
		return this;
	}
	sum(): this {
		this._aggregate = sumAggregate;
		return this;
	}
	average(): this {
		this._aggregate = averageAggregate;
		return this;
	}
	averageDistinct(): this {
		this._aggregate = averageDistinctAggregate;
		return this;
	}
	with(aggregate: AggregateSql | Aggregate): this {
		if (!(aggregate instanceof Aggregate)) {
			aggregate = new Aggregate(aggregate);
		}
		this._aggregate = aggregate;
		return this;
	}

	asBoolean(): EndAggregateFieldBuilder<O, boolean> {
		this._datum = booleanDatum;
		return this as any;
	}
	asEnum(): EndAggregateFieldBuilder<O, string> {
		this._datum = enumDatum;
		return this as any;
	}
	asString(): EndAggregateFieldBuilder<O, string> {
		this._datum = stringDatum;
		return this as any;
	}
	asBinary(): EndAggregateFieldBuilder<O, Buffer> {
		this._datum = binaryDatum;
		return this as any;
	}
	asInt(): EndAggregateFieldBuilder<O, number> {
		this._datum = intDatum;
		return this as any;
	}
	asFloat(): EndAggregateFieldBuilder<O, number> {
		this._datum = floatDatum;
		return this as any;
	}
	asBigInt(): EndAggregateFieldBuilder<O, BigNumber> {
		this._datum = bigIntDatum;
		return this as any;
	}
	asDecimal(): EndAggregateFieldBuilder<O, BigNumber> {
		this._datum = decimalDatum;
		return this as any;
	}
	asDate(): EndAggregateFieldBuilder<O, Date> {
		this._datum = dateDatum;
		return this as any;
	}
	asDateTime(): EndAggregateFieldBuilder<O, Date> {
		this._datum = dateTimeDatum;
		return this as any;
	}
	asTime(): EndAggregateFieldBuilder<O, LocalTime> {
		this._datum = timeDatum;
		return this as any;
	}

	$build(orm: O, path: List<string>): AggregateField<T> {
		const field = new AggregateField<T>(),
			props = field["🜁"];

		props.id = AGGREGATE_FIELD_ID++;
		props.orm = orm;
		props.columns = List(this._columns);
		props.exclusivity = this._exclusivity;
		props.path = path;
		props.aggregate = this._aggregate;
		props.datum = this._datum;

		return field;
	}
}
