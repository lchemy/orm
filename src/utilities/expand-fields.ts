import { Set } from "immutable";

import {
	AggregateField,
	ColumnField,
	DerivedField,
	Field,
	JoinField,
	PartitionedJoinManyField,
	PluckedJoinManyField,
	PluckedJoinOneField
} from "../models";

export function expandFields(fields: Set<Field> | Field[]): Set<ColumnField | DerivedField | AggregateField> {
	if (Array.isArray(fields)) {
		fields = Set(fields);
	}

	return fields.reduce((memo, field) => {
		if (field instanceof ColumnField || field instanceof DerivedField || field instanceof AggregateField) {
			return memo!.add(field);
		} else if (field instanceof PluckedJoinOneField) {
			return memo!.add(field["🜁"].pluckField);
		} else if (field instanceof PartitionedJoinManyField) {
			const joinDefaults = expandFields((field as PartitionedJoinManyField)["🜁"].joinField["🜁"].join["🜀"].defaultFields);
			return memo!.concat(joinDefaults);
		} else if (field instanceof PluckedJoinManyField) {
			return memo!.add(field["🜁"].pluckField);
		} else if (field instanceof JoinField) {
			const joinDefaults = expandFields((field as JoinField)["🜁"].join["🜀"].defaultFields);
			return memo!.concat(joinDefaults);
		}
		throw new Error(`Unknown field: ${ field }`);
	}, Set<ColumnField | DerivedField | AggregateField>());
}
