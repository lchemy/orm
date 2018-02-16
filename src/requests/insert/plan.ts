import { Orm } from "../../models";

export interface InsertPlan {
	orm: Orm;
	items: object[];
}
