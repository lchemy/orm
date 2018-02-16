import { SortDirection } from "../enums";

import { AggregateField, ColumnField, DerivedField } from "./fields";

export type SortDirectionLike = SortDirection | -1 | 0 | 1 | "asc" | "ascending" | "desc" | "descending";

export interface SortBy {
	field: ColumnField | DerivedField | AggregateField;
	direction: SortDirectionLike;
}
