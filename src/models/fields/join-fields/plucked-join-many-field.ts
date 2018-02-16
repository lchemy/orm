import {
	ColumnFilterValue,
	CountManyEqualFilterNode,
	CountManyGreaterThanEqualFilterNode,
	CountManyGreaterThanFilterNode,
	CountManyLessThanEqualFilterNode,
	CountManyLessThanFilterNode,
	CountManyNotEqualFilterNode,
	ExistsManyFilterNode,
	Filter,
	NotExistsManyFilterNode
} from "../../filters";
import { Orm } from "../../orms";
import { ColumnField } from "../column-field";
import { DerivedField } from "../derived-field";
import { Field, FieldProperties } from "../field";

import { JoinManyField } from "./join-many-field";

export type PluckedJoinFilterValue<O, T> = Filter | ((field: ColumnField<T> | DerivedField<T>, orm: O, ...orms: Orm[]) => Filter);

export class PluckedJoinManyFieldProperties<O extends Orm, T> extends FieldProperties {
	pluckField!: ColumnField<T> | DerivedField<T>;
	joinField!: JoinManyField<O>;
}
export class PluckedJoinManyField<O extends Orm = Orm, T = any> extends Field {
	"🜁": PluckedJoinManyFieldProperties<O, T>;

	constructor() {
		super();

		Object.defineProperty(this, "🜁", {
			value: new PluckedJoinManyFieldProperties()
		});
	}

	$exists(query?: PluckedJoinFilterValue<O, T>): ExistsManyFilterNode<O> {
		const { pluckField, joinField } = this["🜁"];
		if (query == null) {
			return new ExistsManyFilterNode(joinField);
		} else if (query instanceof Filter) {
			return new ExistsManyFilterNode(joinField, query);
		} else {
			return new ExistsManyFilterNode(joinField, (orm, ...orms) => query(pluckField, orm, ...orms));
		}
	}

	$notExists(query?: PluckedJoinFilterValue<O, T>): NotExistsManyFilterNode<O> {
		const { pluckField, joinField } = this["🜁"];
		if (query == null) {
			return new NotExistsManyFilterNode(joinField);
		} else if (query instanceof Filter) {
			return new NotExistsManyFilterNode(joinField, query);
		} else {
			return new NotExistsManyFilterNode(joinField, (orm, ...orms) => query(pluckField, orm, ...orms));
		}
	}

	$haveCountEq(count: ColumnFilterValue): CountManyEqualFilterNode<O> {
		return new CountManyEqualFilterNode(this["🜁"].joinField, count);
	}

	$haveCountNeq(count: ColumnFilterValue): CountManyNotEqualFilterNode<O> {
		return new CountManyNotEqualFilterNode(this["🜁"].joinField, count);
	}

	$haveCountGt(count: ColumnFilterValue): CountManyGreaterThanFilterNode<O> {
		return new CountManyGreaterThanFilterNode(this["🜁"].joinField, count);
	}

	$haveCountGte(count: ColumnFilterValue): CountManyGreaterThanEqualFilterNode<O> {
		return new CountManyGreaterThanEqualFilterNode(this["🜁"].joinField, count);
	}

	$haveCountLt(count: ColumnFilterValue): CountManyLessThanFilterNode<O> {
		return new CountManyLessThanFilterNode(this["🜁"].joinField, count);
	}

	$haveCountLte(count: ColumnFilterValue): CountManyLessThanEqualFilterNode<O> {
		return new CountManyLessThanEqualFilterNode(this["🜁"].joinField, count);
	}
}
