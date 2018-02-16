import { BigNumber } from "bignumber.js";
import { LocalTime } from "js-joda";

export type DatumParser<T> = (dialect: string, value: any) => T;
export type DatumFormatter<T> = (dialect: string, value: T) => any;

function datumIdentity(_: string, x: any): any {
	return x;
}

export class Datum<T = any> {
	constructor(private parse: DatumParser<T> = datumIdentity, private format: DatumFormatter<T> = datumIdentity) {

	}

	formatValue(dialect: string, value: T): any {
		if (value == null) {
			return value;
		}
		return this.format(dialect, value);
	}

	parseValue(dialect: string, value: any): T {
		if (value == null) {
			return value;
		}
		return this.parse(dialect, value);
	}
}

export const booleanDatum = new Datum<boolean>((_, value) => {
	if (typeof value === "boolean") {
		return value;
	}
	if (Buffer.isBuffer(value)) {
		return !!value[0];
	}
	if (typeof value === "string") {
		return value !== "false" && value !== "0" && value !== "";
	}
	return !!value;
});

export const enumDatum = new Datum<string>();

export const stringDatum = new Datum<string>();

export const binaryDatum = new Datum<Buffer>((_, value) => {
	if (Buffer.isBuffer(value)) {
		return value;
	}
	return Buffer.from(value);
});

export const intDatum = new Datum<number>();

export const floatDatum = new Datum<number>();

export const bigIntDatum = new Datum<BigNumber>((_, value) => {
	return new BigNumber(value);
});

export const decimalDatum = new Datum<BigNumber>((_, value) => {
	return new BigNumber(value);
});

export const dateDatum = new Datum<Date>((_, value) => {
	if (value instanceof Date) {
		return value;
	}
	return new Date(value);
});

export const dateTimeDatum = new Datum<Date>((_, value) => {
	if (value instanceof Date) {
		return value;
	}
	return new Date(value);
});

export const timeDatum = new Datum<LocalTime>((_, value) => {
	// TODO: test against different db
	return LocalTime.parse(value);
});
