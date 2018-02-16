import { Map } from "immutable";

import { Filter, Orm } from "../../models";

export interface UpdateChange {
	set: Map<string, any>;
	filter: Filter | boolean;
}

export interface UpdatePlan {
	orm: Orm;
	changes: UpdateChange[];
	expected: number | null;
}
