import {
	ColumnFilterValue,
	CountManyEqualFilterNode,
	CountManyGreaterThanEqualFilterNode,
	CountManyGreaterThanFilterNode,
	CountManyLessThanEqualFilterNode,
	CountManyLessThanFilterNode,
	CountManyNotEqualFilterNode,
	ExistsManyFilterNode,
	JoinManyFilterValue,
	NotExistsManyFilterNode
} from "../../filters";
import { Orm } from "../../orms";
import { Field, FieldProperties } from "../field";

import { JoinManyPartitions } from "./join-field-types";
import { JoinManyField } from "./join-many-field";

export class PartitionedJoinManyFieldProperties<O extends Orm, K extends string> extends FieldProperties {
	partitions!: JoinManyPartitions<K>;
	joinField!: JoinManyField<O>;
}
export class $PartitionedJoinManyField<O extends Orm, K extends string> extends Field {
	"🜁": PartitionedJoinManyFieldProperties<O, K>;

	get $all(): JoinManyField<O> {
		return this["🜁"].joinField;
	}

	constructor() {
		super();

		Object.defineProperty(this, "🜁", {
			value: new PartitionedJoinManyFieldProperties()
		});
	}

	$exists(query?: JoinManyFilterValue<O>): ExistsManyFilterNode<O> {
		return new ExistsManyFilterNode(this.$all, query);
	}

	$notExists(query?: JoinManyFilterValue<O>): NotExistsManyFilterNode<O> {
		return new NotExistsManyFilterNode(this.$all, query);
	}

	$haveCountEq(count: ColumnFilterValue): CountManyEqualFilterNode<O> {
		return new CountManyEqualFilterNode(this.$all, count);
	}

	$haveCountNeq(count: ColumnFilterValue): CountManyNotEqualFilterNode<O> {
		return new CountManyNotEqualFilterNode(this.$all, count);
	}

	$haveCountGt(count: ColumnFilterValue): CountManyGreaterThanFilterNode<O> {
		return new CountManyGreaterThanFilterNode(this.$all, count);
	}

	$haveCountGte(count: ColumnFilterValue): CountManyGreaterThanEqualFilterNode<O> {
		return new CountManyGreaterThanEqualFilterNode(this.$all, count);
	}

	$haveCountLt(count: ColumnFilterValue): CountManyLessThanFilterNode<O> {
		return new CountManyLessThanFilterNode(this.$all, count);
	}

	$haveCountLte(count: ColumnFilterValue): CountManyLessThanEqualFilterNode<O> {
		return new CountManyLessThanEqualFilterNode(this.$all, count);
	}
}
export type PartitionedJoinManyField<O extends Orm = Orm, K extends string = string> = $PartitionedJoinManyField<O, K> & {
	[key in K]: JoinManyField<O>;
};
// tslint:disable-next-line:variable-name
export const PartitionedJoinManyField = $PartitionedJoinManyField as new<O extends Orm, K extends string>() => PartitionedJoinManyField<O, K>;
