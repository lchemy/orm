import * as Knex from "knex";

import { ColumnField, DerivedField } from "../models";

import { wrapIdentifier } from "./wrap-identifier";

export function expandSqlTemplate(db: Knex | undefined, sqlTemplate: string, values: any[] = [], withPrefix: boolean = true): { sql: string, bindings: any[] } {
	let i = 0;

	const bindings = [] as any[],
		l = values.length;

	const mapField = (value: any): string => {
		if (value instanceof DerivedField) {
			return value["🜁"].getFieldSql(db, withPrefix);
		} else if (value instanceof ColumnField) {
			if (withPrefix) {
				return wrapIdentifier(db, value["🜁"].fieldName);
			} else {
				return value["🜁"].column.name;
			}
		} else {
			bindings.push(value);
			return "?";
		}
	};

	const sql = sqlTemplate.replace(/\?{1,2}/g, (match) => {
		if (i >= l) {
			// too many question marks, not enough arguments provided
			throw new Error(`Number of sql parameters does not match provided parameters: ${ sqlTemplate } with ${ values }`);
		}

		if (match === "??") {
			const arr = values[i++];
			if (!Array.isArray(arr)) {
				throw new Error(`Expected sql binding value to be an array`);
			}
			return arr.map(mapField).join(", ");
		} else {
			return mapField(values[i++]);
		}
	});

	return { sql, bindings };
}
