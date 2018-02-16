import { Filter, Orm } from "../models";

export function mergeFilterWithAuth(orm: Orm, filter: Filter | boolean, auth?: any): Filter | boolean {
	const authFilterBuilder = orm["🜀"].auth;

	if (authFilterBuilder == null || auth == null || filter === false) {
		return filter;
	}

	const authFilter = authFilterBuilder(auth);
	if (authFilter == null || authFilter === true) {
		return filter;
	} else if (authFilter === false) {
		return false;
	} else if (filter === true) {
		return authFilter;
	} else {
		return filter.and(authFilter);
	}
}
