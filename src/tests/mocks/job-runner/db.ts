import * as Knex from "knex";

export const db = Knex({
	client: "sqlite3",
	connection: {
		filename: ":memory:",
		debug: true
	},
	useNullAsDefault: true
});
