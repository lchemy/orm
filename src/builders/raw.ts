import { WrappedRaw } from "../models";

export interface WrappedRawBuilder {
	(sql: string, bindings?: any[] | Record<string, any>): WrappedRaw;

	now: WrappedRaw;
	currentDate: WrappedRaw;
	currentTime: WrappedRaw;
	currentTimestamp: WrappedRaw;
}

export const raw = (() => {
	const fn = ((sql: string, bindings?: any[] | Record<string, any>): WrappedRaw => {
		return new WrappedRaw(sql, bindings);
	}) as WrappedRawBuilder;

	fn.now = fn("CURRENT_TIMESTAMP");
	fn.currentDate = fn("CURRENT_DATE");
	fn.currentTime = fn("CURRENT_TIME");
	fn.currentTimestamp = fn("CURRENT_TIMESTAMP");

	return fn as WrappedRawBuilder;
})();
