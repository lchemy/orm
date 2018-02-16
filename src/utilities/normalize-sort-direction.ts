import { Set } from "immutable";

import { SortDirection } from "../enums";
import { SortDirectionLike } from "../models";

const DESCENDING_LIKE = Set<any>([
	SortDirection.DESCENDING,
	-1,
	0,
	"desc",
	"descending"
]);

export function normalizeSortDirection(direction: SortDirectionLike): SortDirection {
	return DESCENDING_LIKE.has(direction) ? SortDirection.DESCENDING : SortDirection.ASCENDING;
}
