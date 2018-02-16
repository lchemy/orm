import { Set } from "immutable";

import { Field } from "../fields/field";
import { JoinManyField } from "../fields/join-fields";
import { Orm } from "../orms";

import { ColumnFilterValue } from "./column-filter";
import { Filter } from "./filter";

export type JoinManyFilterValue<O extends Orm> = Filter | ((orm: O, ...orms: Orm[]) => Filter);

export abstract class JoinExistsManyFilterNode<O extends Orm = Orm> extends Filter {
	fields: Set<Field>;
	value?: Filter;

	constructor(public field: JoinManyField<O>, query?: JoinManyFilterValue<O>) {
		super();

		this.fields = Set([field]);

		if (query != null) {
			const props = field["🜁"];
			const orms = [
				props.join,
				...props.through.map((through) => through.orm),
				props.orm
			];

			this.value = typeof query === "function" ? query.apply(undefined, orms) : query;
			this.fields = this.fields.union(this.value!.fields);
		}
	}
}

export class ExistsManyFilterNode<O extends Orm = Orm> extends JoinExistsManyFilterNode<O> {
	clone(): ExistsManyFilterNode<O> {
		return new ExistsManyFilterNode(this.field, this.value);
	}
}

export class NotExistsManyFilterNode<O extends Orm = Orm> extends JoinExistsManyFilterNode<O> {
	clone(): NotExistsManyFilterNode<O> {
		return new NotExistsManyFilterNode(this.field, this.value);
	}
}

export abstract class JoinCountManyFilterNode<O extends Orm = Orm> extends Filter {
	fields: Set<Field>;

	constructor(public field: JoinManyField<O>, public count: ColumnFilterValue) {
		super();

		this.fields = Set([field]);
	}
}

export class CountManyEqualFilterNode<O extends Orm = Orm> extends JoinCountManyFilterNode<O> {
	clone(): CountManyEqualFilterNode<O> {
		return new CountManyEqualFilterNode(this.field, this.count);
	}
}

export class CountManyNotEqualFilterNode<O extends Orm = Orm> extends JoinCountManyFilterNode<O> {
	clone(): CountManyNotEqualFilterNode<O> {
		return new CountManyNotEqualFilterNode(this.field, this.count);
	}
}

export class CountManyGreaterThanFilterNode<O extends Orm = Orm> extends JoinCountManyFilterNode<O> {
	clone(): CountManyGreaterThanFilterNode<O> {
		return new CountManyGreaterThanFilterNode(this.field, this.count);
	}
}

export class CountManyGreaterThanEqualFilterNode<O extends Orm = Orm> extends JoinCountManyFilterNode<O> {
	clone(): CountManyGreaterThanEqualFilterNode<O> {
		return new CountManyGreaterThanEqualFilterNode(this.field, this.count);
	}
}

export class CountManyLessThanFilterNode<O extends Orm = Orm> extends JoinCountManyFilterNode<O> {
	clone(): CountManyLessThanFilterNode<O> {
		return new CountManyLessThanFilterNode(this.field, this.count);
	}
}

export class CountManyLessThanEqualFilterNode<O extends Orm = Orm> extends JoinCountManyFilterNode<O> {
	clone(): CountManyLessThanEqualFilterNode<O> {
		return new CountManyLessThanEqualFilterNode(this.field, this.count);
	}
}
