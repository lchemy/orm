import { Orm, OrmProperties } from "./orm";

export class RelationalOrmProperties extends OrmProperties {

}

export class RelationalOrm extends Orm {
	"🜀": RelationalOrmProperties;

	constructor() {
		super();

		Object.defineProperty(this, "🜀", {
			value: new RelationalOrmProperties()
		});
	}
}
