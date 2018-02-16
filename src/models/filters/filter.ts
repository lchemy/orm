import { Set } from "immutable";

import { filterToString } from "../../utilities";
import { Field } from "../fields/field";

export abstract class Filter {
	fields!: Set<Field>;

	and(...expressions: Filter[]): AndFilterGroup {
		return new AndFilterGroup([this, ...expressions]);
	}

	or(...expressions: Filter[]): OrFilterGroup {
		return new OrFilterGroup([this, ...expressions]);
	}

	abstract clone(): Filter;

	toString(): string {
		return filterToString(this);
	}
}

export abstract class FilterGroup extends Filter {
	constructor(public expressions: Filter[]) {
		super();
		this.fields = getExpressionFields(...expressions);
	}
}

export class AndFilterGroup extends FilterGroup {
	and(...expressions: Filter[]): this {
		this.expressions = this.expressions.concat(...expressions);
		this.fields = this.fields.union(getExpressionFields(...expressions));
		return this;
	}

	clone(): AndFilterGroup {
		return new AndFilterGroup(this.expressions);
	}
}

export class OrFilterGroup extends FilterGroup {
	or(...expressions: Filter[]): this {
		this.expressions = this.expressions.concat(...expressions);
		this.fields = this.fields.union(getExpressionFields(...expressions));
		return this;
	}

	clone(): OrFilterGroup {
		return new OrFilterGroup(this.expressions);
	}
}

function getExpressionFields(...expressions: Filter[]): Set<Field> {
	return expressions.map((expression) => expression.fields).reduce((prev, curr) => {
		return prev.union(curr);
	}, Set());
}
