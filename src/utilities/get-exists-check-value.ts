import * as Knex from "knex";

import { Orm } from "../models";

import { wrapIdentifier } from "./wrap-identifier";

export function getExistsCheckValue(db: Knex, orm: Orm): string {
	return orm["🜀"].primaryFields.map((field) => {
		return `${ wrapIdentifier(db, field["🜁"].fieldName) } IS NOT NULL`;
	}).join(" AND ");
}
