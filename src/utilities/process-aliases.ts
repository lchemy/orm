import { Set } from "immutable";

import { ColumnField, Orm } from "../models";

export function processAliases(orm: Orm): void {
	if (orm["🜀"].cache.aliasesExpanded) {
		return;
	}

	(orm["🜀"].fields.filter((field) => {
		return field instanceof ColumnField && field["🜁"].aliaser != null;
	}) as Set<ColumnField>).forEach((field) => {
		const alias = field["🜁"].aliaser!(orm);
		field["🜁"].alias = alias;
		alias["🜁"].alias = field;
	});

	orm["🜀"].cache.aliasesExpanded = true;
}
