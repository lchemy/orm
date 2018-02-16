import { ExistsOneFilterNode, NotExistsOneFilterNode } from "../../filters";
import { Orm } from "../../orms";

import { JoinField, JoinFieldProperties } from "./join-field";
import { PluckedJoinOneField } from "./plucked-join-one-field";

export class JoinOneFieldProperties<O extends Orm> extends JoinFieldProperties<O> {
	optional!: boolean;
	pluckedBy?: PluckedJoinOneField<O, any>;
}
export class $JoinOneField<O extends Orm> extends JoinField<O> {
	"🜁": JoinOneFieldProperties<O>;

	constructor() {
		super();

		Object.defineProperty(this, "🜁", {
			value: new JoinOneFieldProperties()
		});
	}

	$exists(): ExistsOneFilterNode<O> {
		return new ExistsOneFilterNode(this as any as JoinOneField<O>);
	}

	$notExists(): NotExistsOneFilterNode<O> {
		return new NotExistsOneFilterNode(this as any as JoinOneField<O>);
	}
}
export type JoinOneField<O extends Orm = Orm> = $JoinOneField<O> & O;
// tslint:disable-next-line:variable-name
export const JoinOneField = $JoinOneField as new<O extends Orm>() => JoinOneField<O>;
