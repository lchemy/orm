// @ts-ignore
import { BigNumber } from "bignumber.js";
// @ts-ignore
import { LocalTime } from "js-joda";

import {
	Column,
	Datum,
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

export const columnBuilders = {
	boolean: makeColumnBuilder(booleanDatum),
	enum: makeColumnBuilder(enumDatum),
	string: makeColumnBuilder(stringDatum),
	istring: makeColumnBuilder(stringDatum),
	binary: makeColumnBuilder(binaryDatum),
	int: makeColumnBuilder(intDatum),
	float: makeColumnBuilder(floatDatum),
	bigInt: makeColumnBuilder(bigIntDatum),
	decimal: makeColumnBuilder(decimalDatum),
	date: makeColumnBuilder(dateDatum),
	dateTime: makeColumnBuilder(dateTimeDatum),
	time: makeColumnBuilder(timeDatum),
	timestamp: makeColumnBuilder(dateTimeDatum)
};

export type ColumnBuilder<T> = (name: string) => Column<T>;
export type ColumnBuilders = typeof columnBuilders;

function makeColumnBuilder<T>(datum: Datum<T>): ColumnBuilder<T> {
	return (name: string) => {
		const column = new Column<T>();
		column.datum = datum;
		column.name = name;
		return column;
	};
}
