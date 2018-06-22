import { ColumnField } from "../models";

import { getFromPath } from "./get-from-path";

export function getFieldValue(field: ColumnField, item: object): any {
	const { path, alias } = field["🜁"],
		value = getFromPath(item, path.slice(1));
	if (value !== undefined) {
		return value;
	} else if (alias != null) {
		return getFromPath(item, alias["🜁"].path.slice(1));
	} else {
		return undefined;
	}
}
