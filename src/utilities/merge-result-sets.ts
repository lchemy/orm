import { ColumnField, DerivedField, JoinManyPartitions, Orm } from "../models";

export function mergeResultSets(
	childOrm: Orm,
	baseRows: Array<Record<string, any>>,
	childRows: Array<Record<string, any>>,
	childPartitions?: JoinManyPartitions<string>,
	childPluckField?: ColumnField | DerivedField
): object[] {
	const childPath = childOrm["🜀"].tablePath;

	const parentFieldPaths = childOrm["🜀"].parent!["🜀"].primaryFields.toArray().map((field) => field["🜁"].fieldPath);

	return baseRows.map((baseRow) => {
		const parentFieldValues = parentFieldPaths.map((name) => baseRow[name]),
			parentExists = parentFieldValues.every((value) => value != null);

		if (!parentExists) {
			return baseRow;
		}

		const matchedRows = childRows.filter((childRow) => {
			return parentFieldPaths.every((name, i) => {
				return childRow[name] === parentFieldValues[i];
			});
		}).map((childRow) => {
			return trimPath(childRow, childPath);
		});

		if (childPartitions != null) {
			Object.keys(childPartitions).forEach((key) => {
				const partitionCheckPath = `__partition_${ key }`;
				baseRow[`${ childPath }$${ key }`] = matchedRows.filter((childRow) => childRow[partitionCheckPath]);
			});
		} else if (childPluckField != null) {
			const pluckFieldPath = childPluckField["🜁"].fieldPath,
				childPluckFieldPath = pluckFieldPath.substr(childPath.length + 1);
			baseRow[childPath] = matchedRows.map((childRow) => childRow[childPluckFieldPath]);
		} else {
			baseRow[childPath] = matchedRows;
		}

		return baseRow;
	});
}

function trimPath(target: any, path: string): any {
	if (path.length === 0) {
		return target;
	}

	const pathTrim = path.length + 1;
	return Object.keys(target).filter((key) => key.startsWith(path)).reduce((memo, key) => {
		const newKey = key.substr(pathTrim);
		memo[newKey] = target[key];
		return memo;
	}, {} as any);
}
