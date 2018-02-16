import { Filter } from "../../filters";
import { Orm } from "../../orms";
import { Field, FieldProperties } from "../field";

import { JoinOn } from "./join-field-types";

export abstract class JoinFieldProperties<O extends Orm> extends FieldProperties {
	join!: O;
	on!: Filter;
	through!: Array<JoinOn<Orm>>;
	auth?: (auth: any) => Filter | boolean;
}
export abstract class JoinField<O extends Orm = Orm> extends Field {
	"🜁": JoinFieldProperties<O>;
}
