import {
	BetweenFilterNode, ColumnFilterValue, EqualFilterNode, GreaterThanEqualFilterNode, GreaterThanFilterNode, ILikeFilterNode, InFilterNode,
	IsNotNullFilterNode, IsNullFilterNode, LessThanEqualFilterNode, LessThanFilterNode, LikeFilterNode, NotBetweenFilterNode, NotEqualFilterNode,
	NotILikeFilterNode, NotInFilterNode, NotLikeFilterNode
} from "../filters";

import { Field } from "./field";

export abstract class FilterableField extends Field {
	protected get "🜄"(): FilterableField {
		return this;
	}

	$eq(value: ColumnFilterValue): EqualFilterNode {
		return new EqualFilterNode(this["🜄"], value);
	}
	$neq(value: ColumnFilterValue): NotEqualFilterNode {
		return new NotEqualFilterNode(this["🜄"], value);
	}

	$gt(value: ColumnFilterValue): GreaterThanFilterNode {
		return new GreaterThanFilterNode(this["🜄"], value);
	}
	$gte(value: ColumnFilterValue): GreaterThanEqualFilterNode {
		return new GreaterThanEqualFilterNode(this["🜄"], value);
	}

	$lt(value: ColumnFilterValue): LessThanFilterNode {
		return new LessThanFilterNode(this["🜄"], value);
	}
	$lte(value: ColumnFilterValue): LessThanEqualFilterNode {
		return new LessThanEqualFilterNode(this["🜄"], value);
	}

	$like(value: ColumnFilterValue): LikeFilterNode {
		return new LikeFilterNode(this["🜄"], value);
	}
	$notLike(value: ColumnFilterValue): NotLikeFilterNode {
		return new NotLikeFilterNode(this["🜄"], value);
	}

	$ilike(value: ColumnFilterValue): ILikeFilterNode {
		return new ILikeFilterNode(this["🜄"], value);
	}
	$notIlike(value: ColumnFilterValue): NotILikeFilterNode {
		return new NotILikeFilterNode(this["🜄"], value);
	}

	$between(min: ColumnFilterValue, max: ColumnFilterValue): BetweenFilterNode {
		return new BetweenFilterNode(this["🜄"], [min, max]);
	}
	$notBetween(min: ColumnFilterValue, max: ColumnFilterValue): NotBetweenFilterNode {
		return new NotBetweenFilterNode(this["🜄"], [min, max]);
	}

	$in(...values: ColumnFilterValue[]): InFilterNode {
		return new InFilterNode(this["🜄"], values);
	}
	$notIn(...values: ColumnFilterValue[]): NotInFilterNode {
		return new NotInFilterNode(this["🜄"], values);
	}

	$isNull(): IsNullFilterNode {
		return new IsNullFilterNode(this["🜄"]);
	}
	$isNotNull(): IsNotNullFilterNode {
		return new IsNotNullFilterNode(this["🜄"]);
	}
}
