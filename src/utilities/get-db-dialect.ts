import * as Knex from "knex";

export function getDbDialect(knex: Knex | undefined): string {
	return knex != null ? knex.client.dialect : "mysql";
}
