import { Set } from "immutable";

import { AggregateField, ColumnField, DerivedField, Field } from "./fields";

export class CompositeProperties {
	fields!: Set<Field>;
	defaultFields!: Set<ColumnField | DerivedField | AggregateField>;
}

export type Composite = {
	"🜂": CompositeProperties
} & {
	[key: string]: Field
};

export function makeComposite(): Composite {
	const composite = {} as Composite;
	Object.defineProperty(composite, "🜂", {
		value: new CompositeProperties()
	});
	return composite;
}

export function isComposite(target: any): target is Composite {
	return target != null && typeof target === "object" && target["🜂"] instanceof CompositeProperties;
}
