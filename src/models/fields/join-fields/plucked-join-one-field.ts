import { Filter } from "../../filters";
import { Orm } from "../../orms";
import { ColumnField } from "../column-field";
import { DerivedField } from "../derived-field";
import { FieldProperties } from "../field";
import { FilterableField } from "../filterable-field";

import { JoinOneField } from "./join-one-field";

export class PluckedJoinOneFieldProperties<O extends Orm, T> extends FieldProperties {
	pluckField!: ColumnField<T> | DerivedField<T>;
	joinField!: JoinOneField<O>;

	get fieldPath(): string {
		if (this._fieldPath == null) {
			this._fieldPath = this.path.join("$");
		}
		return this._fieldPath;
	}
	private _fieldPath!: string;
}
export class PluckedJoinOneField<O extends Orm = Orm, T = any> extends FilterableField {
	"🜁": PluckedJoinOneFieldProperties<O, T>;

	protected get "🜄"(): FilterableField {
		return this["🜁"].pluckField;
	}

	constructor() {
		super();

		Object.defineProperty(this, "🜁", {
			value: new PluckedJoinOneFieldProperties()
		});
	}

	$exists(): Filter {
		const { joinField, pluckField } = this["🜁"];
		return joinField.$exists().and(pluckField.$isNotNull());
	}

	$notExists(): Filter {
		const { joinField, pluckField } = this["🜁"];
		return joinField.$notExists().or(pluckField.$isNull());
	}
}
