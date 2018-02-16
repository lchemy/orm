import { Orm, OrmProperties } from "./orm";

export class AggregateOrmProperties extends OrmProperties {

}

export class AggregateOrm extends Orm {
	"🜀": AggregateOrmProperties;

	constructor() {
		super();

		Object.defineProperty(this, "🜀", {
			value: new AggregateOrmProperties()
		});
	}
}
