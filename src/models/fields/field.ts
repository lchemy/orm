import { List } from "immutable";

import { FieldExclusion } from "../../enums";
import { Orm } from "../orms";

export abstract class FieldProperties {
	orm!: Orm;
	exclusivity!: FieldExclusion;

	path!: List<string>;

	get depth(): number {
		return this.orm["🜀"].depth;
	}
}
export abstract class Field {
	"🜁": FieldProperties;

	toString() {
		return this["🜁"].path.join(".");
	}
}
