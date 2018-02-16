import { Set } from "immutable";

import { ColumnField, DerivedField, RelationalOrm } from "../models";

export function simplifyGroupBy(groupBy: Set<ColumnField | DerivedField>): Set<ColumnField | DerivedField> {
	// simplify the query by removing fields from group by if grouping by the primary keys of an orm already
	const groupByOrms = groupBy.map((field) => field["🜁"].orm).filter((fieldOrm) => {
		return fieldOrm instanceof RelationalOrm;
	}).filter((fieldOrm) => {
		const primaryFields = fieldOrm["🜀"].primaryFields;
		return !primaryFields.isEmpty() && groupBy.isSuperset(primaryFields);
	});

	if (groupByOrms.size === 0) {
		return groupBy;
	}

	return groupBy.filter((field) => {
		return !groupByOrms.has(field["🜁"].orm) || (field instanceof ColumnField && field["🜁"].primary);
	});
}
