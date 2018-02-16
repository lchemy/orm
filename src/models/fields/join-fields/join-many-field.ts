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
import { SortBy } from "../../sort-by";

import { JoinField, JoinFieldProperties } from "./join-field";
import { PartitionedJoinManyField } from "./partitioned-join-many-field";
import { PluckedJoinManyField } from "./plucked-join-many-field";

export class JoinManyFieldProperties<O extends Orm> extends JoinFieldProperties<O> {
	sortBy?: SortBy[];
	partitionedBy?: PartitionedJoinManyField<O, string>;
	partitionedFrom?: PartitionedJoinManyField<O, string>;
	partitionKey?: string;
	pluckedBy?: PluckedJoinManyField<O, any>;
}
export class $JoinManyField<O extends Orm> extends JoinField<O> {
	"🜁": JoinManyFieldProperties<O>;

	constructor() {
		super();

		Object.defineProperty(this, "🜁", {
			value: new JoinManyFieldProperties()
		});
	}

	$exists(query?: JoinManyFilterValue<O>): ExistsManyFilterNode<O> {
		return new ExistsManyFilterNode(this as any as JoinManyField<O>, query);
	}

	$notExists(query?: JoinManyFilterValue<O>): NotExistsManyFilterNode<O> {
		return new NotExistsManyFilterNode(this as any as JoinManyField<O>, query);
	}

	$haveCountEq(count: ColumnFilterValue): CountManyEqualFilterNode<O> {
		return new CountManyEqualFilterNode(this as any as JoinManyField<O>, count);
	}

	$haveCountNeq(count: ColumnFilterValue): CountManyNotEqualFilterNode<O> {
		return new CountManyNotEqualFilterNode(this as any as JoinManyField<O>, count);
	}

	$haveCountGt(count: ColumnFilterValue): CountManyGreaterThanFilterNode<O> {
		return new CountManyGreaterThanFilterNode(this as any as JoinManyField<O>, count);
	}

	$haveCountGte(count: ColumnFilterValue): CountManyGreaterThanEqualFilterNode<O> {
		return new CountManyGreaterThanEqualFilterNode(this as any as JoinManyField<O>, count);
	}

	$haveCountLt(count: ColumnFilterValue): CountManyLessThanFilterNode<O> {
		return new CountManyLessThanFilterNode(this as any as JoinManyField<O>, count);
	}

	$haveCountLte(count: ColumnFilterValue): CountManyLessThanEqualFilterNode<O> {
		return new CountManyLessThanEqualFilterNode(this as any as JoinManyField<O>, count);
	}
}
export type JoinManyField<O extends Orm = Orm> = $JoinManyField<O> & O;
// tslint:disable-next-line:variable-name
export const JoinManyField = $JoinManyField as new<O extends Orm>() => JoinManyField<O>;
