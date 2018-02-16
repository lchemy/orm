import { BigNumber } from "bignumber.js";
import { LocalTime } from "js-joda";

const PRIVATE_PROPERTY_NAME_REGEXP = /(^|\$)__/;
const ALLOWED_CONSTRUCTORS = new Set([
	Buffer,
	Date,
	BigNumber,
	LocalTime
]);

export function unflatten(item: any[]): any[];
export function unflatten(item: any): any;
export function unflatten(item: any): any {
	if (item == null) {
		return item;
	}

	if (Array.isArray(item)) {
		item.forEach((value, i) => {
			item[i] = unflatten(value);
		});
		return item;
	}

	if (typeof item !== "object" || ALLOWED_CONSTRUCTORS.has(item.constructor)) {
		return item;
	}

	return Object.keys(item).filter((key) => {
		return !PRIVATE_PROPERTY_NAME_REGEXP.test(key);
	}).reduce<Record<string, any>>((memo, key) => {
		const value = unflatten(item[key]);
		key.split("$").reduce((inner, piece, i, pieces) => {
			if (inner[piece] === undefined) {
				inner[piece] = {};
			}
			if (i === pieces.length - 1) {
				inner[piece] = value;
			}
			return inner[piece];
		}, memo);
		return memo;
	}, {});
}
