import { List } from "immutable";

export function getFromPath(item: any, path: List<string>): any {
	if (path.size === 0) {
		return item;
	}
	if (item == null) {
		return undefined;
	}
	return getFromPath(item[path.get(0)!], path.slice(1));
}
