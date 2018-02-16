import { ColumnField, DerivedField, JoinManyPartitions } from "../../models";

import { SelectCountQuery, SelectRowsQuery } from "./query";

export interface FindCountPlan {
	query: SelectCountQuery;
}

export interface FindModelsPlan {
	query: SelectRowsQuery;
	partitions?: JoinManyPartitions<string>;
	pluckField?: ColumnField | DerivedField;
	children: FindModelsPlan[];
}

export type FindPlan = FindCountPlan | FindModelsPlan;
