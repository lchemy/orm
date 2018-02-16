import * as Knex from "knex";

export function wrapIdentifier(db: Knex | undefined, identifier: string): string {
	if (db == null) {
		return identifier;
	}

	return identifier.split(".").map((piece) => {
		return db.client.wrapIdentifier(piece);
	}).join(".");
}
