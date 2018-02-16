import { ColumnField, Filter, WrappedRaw } from "../models";

import { filterToSql } from "./filter-to-sql";

export function filterToString(filter: Filter): string {
	const { sql, bindings } = filterToSql(undefined, filter);

	let i = 0;
	return sql.replace(/\?/g, () => {
		return stringify(bindings.get(i++));
	});
}

function stringify(value: any): string {
	if (Array.isArray(value)) {
		return value.map(stringify).join(", ");
	} else if (Buffer.isBuffer(value)) {
		return `0x${ value.toString("hex") }`;
	} else if (value instanceof WrappedRaw) {
		return value.toString();
	} else if (value instanceof ColumnField) {
		return value.toString();
	} else if (typeof value === "string") {
		return `'${ value.replace(/([\\'])/g, "\\$1") }'`;
	} else {
		return String(value);
	}
}
