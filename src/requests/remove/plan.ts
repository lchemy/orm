import { Filter, Orm } from "../../models";

export interface RemovePlan {
	orm: Orm;
	filter: Filter | boolean;
	expected: number | null;
}
