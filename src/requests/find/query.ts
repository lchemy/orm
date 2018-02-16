import { Map, Set } from "immutable";

import { AggregateField, ColumnField, DerivedField, Filter, Orm, Pagination, SortBy } from "../../models";

export interface SelectQuery {
	orm: Orm;
	joins: Map<Orm, Filter | boolean>;
	filter?: Filter | boolean;
	groupBy?: Set<ColumnField | DerivedField>;
	count?: boolean;
}

export interface SelectCountQuery extends SelectQuery {
	count: true;
}

export interface SelectRowsQuery extends SelectQuery {
	fields: Set<ColumnField | DerivedField | AggregateField>;
	sortBy?: SortBy[];
	pagination?: Pagination;
	count?: false;
}
