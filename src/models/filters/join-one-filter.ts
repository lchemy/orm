import { Set } from "immutable";

import { Field } from "../fields/field";
import { JoinOneField } from "../fields/join-fields";
import { Orm } from "../orms";

import { Filter } from "./filter";

export abstract class JoinExistsOneFilterNode<O extends Orm = Orm> extends Filter {
	fields: Set<Field>;

	constructor(public field: JoinOneField<O>) {
		super();

		this.fields = Set([field]);
	}
}

export class ExistsOneFilterNode<O extends Orm = Orm> extends JoinExistsOneFilterNode<O> {
	clone(): ExistsOneFilterNode<O> {
		return new ExistsOneFilterNode(this.field);
	}
}

export class NotExistsOneFilterNode<O extends Orm = Orm> extends JoinExistsOneFilterNode<O> {
	clone(): NotExistsOneFilterNode<O> {
		return new NotExistsOneFilterNode(this.field);
	}
}
