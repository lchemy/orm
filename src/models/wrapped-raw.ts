import * as Knex from "knex";

import { expandSqlTemplate, getDbDialect } from "../utilities";

export type WrappedRawSql = string | ((dialect: string) => string);

export class WrappedRaw {
	constructor(public sql: WrappedRawSql, public bindings: any[] = []) {

	}

	toRaw(db: Knex): Knex.Raw {
		const sqlTemplate = typeof this.sql === "string" ? this.sql : this.sql(getDbDialect(db)),
			{ sql, bindings } = expandSqlTemplate(db, sqlTemplate, this.bindings);
		return db.raw(sql, bindings);
	}
}
