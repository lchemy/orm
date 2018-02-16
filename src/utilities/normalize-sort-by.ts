import { SortDirection } from "../enums";
import { AggregateField, ColumnField, DerivedField, Field, SortBy } from "../models";

export function normalizeSortBy(sortBy: ColumnField | DerivedField | AggregateField | SortBy): SortBy {
	if (!(sortBy instanceof Field)) {
		return sortBy;
	}

	return {
		field: sortBy,
		direction: SortDirection.ASCENDING
	};
}
