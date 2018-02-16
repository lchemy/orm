import { Orm } from "../models";

export function getBaseParentOrm(orm: Orm): Orm | undefined {
	if (orm["🜀"].base["🜀"].parent == null) {
		return undefined;
	}
	return orm["🜀"].base["🜀"].parent!["🜀"].base;
}
