import * as Knex from "knex";

import { getDbDialect, wrapIdentifier } from "../utilities";

export type DerivativeSql = (dialect: string, ...columnNames: string[]) => string;

export class Derivative {
	constructor(public sql: DerivativeSql) {

	}

	toSql(db: Knex | undefined, ...columnNames: string[]): string {
		const wrappedColumnNames = columnNames.map((columnName) => wrapIdentifier(db, columnName));
		return this.sql(getDbDialect(db), ...wrappedColumnNames);
	}
}
