import { BigNumber } from "bignumber.js";
import { Set } from "immutable";
import { LocalTime } from "js-joda";

import { FilterableField } from "../fields";
import { WrappedRaw } from "../wrapped-raw";

import { Filter } from "./filter";

export type ColumnFilterValue = string | number | boolean | BigNumber | LocalTime | Date | Buffer | FilterableField | WrappedRaw;

export abstract class ColumnFilterNode extends Filter {
	left: ColumnFilterValue;
	right: ColumnFilterValue | ColumnFilterValue[] | undefined;

	constructor(left: ColumnFilterValue, right: ColumnFilterValue | ColumnFilterValue[] | undefined) {
		super();
		this.left = left;
		this.right = right;
		this.fields = getFields(left).union(getFields(right));
	}
}

function getFields(items: ColumnFilterValue | ColumnFilterValue[] | undefined): Set<FilterableField> {
	if (items == null) {
		return Set();
	}

	if (!Array.isArray(items)) {
		items = [items];
	}

	const fields = items.filter((item) => {
		return item instanceof FilterableField;
	}) as FilterableField[];

	return Set(fields);
}



export abstract class EqualityFilterNode extends ColumnFilterNode {
	right!: ColumnFilterValue;
}

export class EqualFilterNode extends EqualityFilterNode {
	clone(): EqualFilterNode {
		return new EqualFilterNode(this.left, this.right);
	}
}

export class NotEqualFilterNode extends EqualityFilterNode {
	clone(): NotEqualFilterNode {
		return new NotEqualFilterNode(this.left, this.right);
	}
}



export abstract class ComparisonFilterNode extends ColumnFilterNode {
	right!: ColumnFilterValue;
}

export class GreaterThanFilterNode extends ComparisonFilterNode {
	clone(): GreaterThanFilterNode {
		return new GreaterThanFilterNode(this.left, this.right);
	}
}

export class GreaterThanEqualFilterNode extends ComparisonFilterNode {
	clone(): GreaterThanEqualFilterNode {
		return new GreaterThanEqualFilterNode(this.left, this.right);
	}
}

export class LessThanFilterNode extends ComparisonFilterNode {
	clone(): LessThanFilterNode {
		return new LessThanFilterNode(this.left, this.right);
	}
}

export class LessThanEqualFilterNode extends ComparisonFilterNode {
	clone(): LessThanEqualFilterNode {
		return new LessThanEqualFilterNode(this.left, this.right);
	}
}



export abstract class LikeComparisonFilterNode extends ColumnFilterNode {
	right!: ColumnFilterValue;
}

export class LikeFilterNode extends LikeComparisonFilterNode {
	clone(): LikeFilterNode {
		return new LikeFilterNode(this.left, this.right);
	}
}

export class NotLikeFilterNode extends LikeComparisonFilterNode {
	clone(): NotLikeFilterNode {
		return new NotLikeFilterNode(this.left, this.right);
	}
}

export class ILikeFilterNode extends LikeComparisonFilterNode {
	clone(): ILikeFilterNode {
		return new ILikeFilterNode(this.left, this.right);
	}
}

export class NotILikeFilterNode extends LikeComparisonFilterNode {
	clone(): NotILikeFilterNode {
		return new NotILikeFilterNode(this.left, this.right);
	}
}



export abstract class RangeFilterNode extends ColumnFilterNode {
	right!: [ColumnFilterValue, ColumnFilterValue];
}

export class BetweenFilterNode extends RangeFilterNode {
	clone(): BetweenFilterNode {
		return new BetweenFilterNode(this.left, this.right);
	}
}

export class NotBetweenFilterNode extends RangeFilterNode {
	clone(): NotBetweenFilterNode {
		return new NotBetweenFilterNode(this.left, this.right);
	}
}



export abstract class ContainsCheckFilterNode extends ColumnFilterNode {
	right!: ColumnFilterValue[];
}

export class InFilterNode extends ContainsCheckFilterNode {
	clone(): InFilterNode {
		return new InFilterNode(this.left, this.right);
	}
}

export class NotInFilterNode extends ContainsCheckFilterNode {
	clone(): NotInFilterNode {
		return new NotInFilterNode(this.left, this.right);
	}
}



export abstract class NullCheckFilterNode extends ColumnFilterNode {
	right: undefined;

	constructor(left: ColumnFilterValue) {
		super(left, undefined);
	}

	protected getBindings(): ColumnFilterValue[] {
		return [this.left];
	}
}

export class IsNullFilterNode extends NullCheckFilterNode {
	clone(): IsNullFilterNode {
		return new IsNullFilterNode(this.left);
	}
}

export class IsNotNullFilterNode extends NullCheckFilterNode {
	clone(): IsNotNullFilterNode {
		return new IsNotNullFilterNode(this.left);
	}
}
