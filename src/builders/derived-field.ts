import { BigNumber } from "bignumber.js";
import { List } from "immutable";
import { LocalTime } from "js-joda";

import { FieldExclusion } from "../enums";
import {
	Column,
	Datum,
	Derivative,
	DerivativeSql,
	DerivedField,
	Orm,
	bigIntDatum,
	binaryDatum,
	booleanDatum,
	dateDatum,
	dateTimeDatum,
	decimalDatum,
	enumDatum,
	floatDatum,
	intDatum,
	stringDatum,
	timeDatum
} from "../models";

export type DerivedFieldBuilderFactory<O extends Orm> = (...columns: Column[]) => StartDerivedFieldBuilder<O>;

export interface StartDerivedFieldBuilder<O extends Orm> {
	with(derivative: DerivativeSql | Derivative): MidDerivedFieldBuilder<O>;
}

export interface MidDerivedFieldBuilder<O extends Orm> {
	asBoolean(): EndDerivedFieldBuilder<O, boolean>;
	asEnum(): EndDerivedFieldBuilder<O, string>;
	asString(): EndDerivedFieldBuilder<O, string>;
	asBinary(): EndDerivedFieldBuilder<O, Buffer>;
	asInt(): EndDerivedFieldBuilder<O, number>;
	asFloat(): EndDerivedFieldBuilder<O, number>;
	asBigInt(): EndDerivedFieldBuilder<O, BigNumber>;
	asDecimal(): EndDerivedFieldBuilder<O, BigNumber>;
	asDate(): EndDerivedFieldBuilder<O, Date>;
	asDateTime(): EndDerivedFieldBuilder<O, Date>;
	asTime(): EndDerivedFieldBuilder<O, LocalTime>;
}

export interface EndDerivedFieldBuilder<O extends Orm, T> {
	include(): this;
	$build(orm: O, path: List<string>): DerivedField<T>;
}

export function makeDerivedFieldBuilder<O extends Orm>(): DerivedFieldBuilderFactory<O> {
	return (...columns: Column[]) => {
		return new DerivedFieldBuilder<O, any>(List(columns));
	};
}

let DERIVED_FIELD_ID: number = 0;
export class DerivedFieldBuilder<O extends Orm, T> implements StartDerivedFieldBuilder<O>, MidDerivedFieldBuilder<O>, EndDerivedFieldBuilder<O, T> {
	private _exclusivity: FieldExclusion = FieldExclusion.EXCLUDE;
	private _derivative!: Derivative;
	private _datum!: Datum;

	constructor(private _columns: List<Column>) {
	}

	include(): this {
		this._exclusivity = FieldExclusion.INCLUDE;
		return this;
	}

	with(derivative: DerivativeSql | Derivative): this {
		if (!(derivative instanceof Derivative)) {
			derivative = new Derivative(derivative);
		}
		this._derivative = derivative;
		return this;
	}

	asBoolean(): EndDerivedFieldBuilder<O, boolean> {
		this._datum = booleanDatum;
		return this as any;
	}
	asEnum(): EndDerivedFieldBuilder<O, string> {
		this._datum = enumDatum;
		return this as any;
	}
	asString(): EndDerivedFieldBuilder<O, string> {
		this._datum = stringDatum;
		return this as any;
	}
	asBinary(): EndDerivedFieldBuilder<O, Buffer> {
		this._datum = binaryDatum;
		return this as any;
	}
	asInt(): EndDerivedFieldBuilder<O, number> {
		this._datum = intDatum;
		return this as any;
	}
	asFloat(): EndDerivedFieldBuilder<O, number> {
		this._datum = floatDatum;
		return this as any;
	}
	asBigInt(): EndDerivedFieldBuilder<O, BigNumber> {
		this._datum = bigIntDatum;
		return this as any;
	}
	asDecimal(): EndDerivedFieldBuilder<O, BigNumber> {
		this._datum = decimalDatum;
		return this as any;
	}
	asDate(): EndDerivedFieldBuilder<O, Date> {
		this._datum = dateDatum;
		return this as any;
	}
	asDateTime(): EndDerivedFieldBuilder<O, Date> {
		this._datum = dateTimeDatum;
		return this as any;
	}
	asTime(): EndDerivedFieldBuilder<O, LocalTime> {
		this._datum = timeDatum;
		return this as any;
	}

	$build(orm: O, path: List<string>): DerivedField<T> {
		const field = new DerivedField<T>(),
			props = field["🜁"];

		props.orm = orm;
		props.exclusivity = this._exclusivity;
		props.path = path;

		props.id = DERIVED_FIELD_ID++;
		props.columns = this._columns;
		props.datum = this._datum;
		props.derivative = this._derivative;

		return field;
	}
}
