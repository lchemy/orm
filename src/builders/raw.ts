import { WrappedRaw } from "../models";

export interface WrappedRawBuilder {
	(sql: string, bindings?: any[] | Record<string, any>): WrappedRaw;

	now: WrappedRaw;
	currentDate: WrappedRaw;
	currentTime: WrappedRaw;
	currentTimestamp: WrappedRaw;

	asBoolean: (value: any) => WrappedRaw;
	asString: (value: any) => WrappedRaw;
	asInt: (value: any) => WrappedRaw;
	asBigInt: (value: any) => WrappedRaw;
	asFloat: (value: any) => WrappedRaw;
	asDate: (value: any) => WrappedRaw;
	asTimestamp: (value: any) => WrappedRaw;
}

export const raw = (() => {
	const fn = ((sql: string, bindings?: any[]): WrappedRaw => {
		return new WrappedRaw(sql, bindings);
	}) as WrappedRawBuilder;

	fn.now = fn("CURRENT_TIMESTAMP");
	fn.currentDate = fn("CURRENT_DATE");
	fn.currentTime = fn("CURRENT_TIME");
	fn.currentTimestamp = fn("CURRENT_TIMESTAMP");

	const castFnBuilder = (type: string) => {
		return (value: any) => fn(`CAST(? AS ${ type })`, [value]);
	};

	fn.asBoolean = castFnBuilder("BOOLEAN");
	fn.asString = castFnBuilder("STRING");
	fn.asInt = castFnBuilder("INT");
	fn.asBigInt = castFnBuilder("BIGINT");
	fn.asFloat = castFnBuilder("FLOAT");
	fn.asDate = castFnBuilder("DATE");
	fn.asTimestamp = castFnBuilder("TIMESTAMP");

	return fn as WrappedRawBuilder;
})();
