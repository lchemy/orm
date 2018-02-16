import * as Knex from "knex";

import { getDbDialect } from "../utilities";

export type WrappedRawSql = string | ((dialect: string) => string);

export class WrappedRaw {
	constructor(public sql: WrappedRawSql, public bindings: any[] | Record<string, any> = []) {

	}

	toRaw(db: Knex): Knex.Raw {
		const sql = typeof this.sql === "string" ? this.sql : this.sql(getDbDialect(db));
		return db.raw(sql, this.bindings);
	}
}
