import { QueryBuilder } from "knex";
import * as Knex from "knex";

import { AttachFilterMode } from "../enums";
import {
	JoinManyField,
	JoinOneField,
	Subquery,
	Table
} from "../models";

import { attachFilter } from "./attach-filter";

export function buildJoinQuery(db: Knex, qb: QueryBuilder, field: JoinOneField | JoinManyField): QueryBuilder {
	const { join, on, through } = field["🜁"];

	// add join table
	const joinSchema = join["🜀"].schema,
		joinTableAs = join["🜀"].tableAs;

	let joinTable: QueryBuilder | string;
	if (joinSchema as any instanceof Subquery) {
		joinTable = (joinSchema as Subquery)["🜃"].subquery(db).as(joinTableAs);
	} else if (joinSchema as any instanceof Table) {
		joinTable = `${ (joinSchema as Table)["🜃"].table } AS ${ joinTableAs }`;
	} else {
		throw new Error(`Unexpected schema: ${ joinSchema }`);
	}
	qb.table(joinTable as any);

	// add through tables
	through.forEach((t) => {
		const throughSchema = t.orm["🜀"].schema,
			throughTableAs = t.orm["🜀"].tableAs;

		let throughTable: QueryBuilder | string;
		if (throughSchema as any instanceof Subquery) {
			throughTable = (throughSchema as Subquery)["🜃"].subquery(db).as(throughTableAs);
		} else if (throughSchema as any instanceof Table) {
			throughTable = `${ (throughSchema as Table)["🜃"].table } AS ${ throughTableAs }`;
		} else {
			throw new Error(`Unexpected schema: ${ throughSchema }`);
		}

		qb.leftJoin(throughTable, (clause) => {
			attachFilter(db, clause, t.on, AttachFilterMode.ON);
		});
	});

	// add join where
	attachFilter(db, qb, on, AttachFilterMode.WHERE);

	return qb;
}
