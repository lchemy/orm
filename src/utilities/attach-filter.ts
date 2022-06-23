import { JoinClause, QueryBuilder } from "knex";
import * as Knex from "knex";

import { AttachFilterGrouping, AttachFilterMode } from "../enums";
import { Filter } from "../models";

import { filterToSql } from "./filter-to-sql";

export function attachFilter(db: Knex, qb: QueryBuilder, filter: Filter | boolean, mode: AttachFilterMode.WHERE, withPrefix?: boolean, grouping?: AttachFilterGrouping): QueryBuilder;
export function attachFilter(db: Knex, qb: JoinClause, filter: Filter | boolean, mode: AttachFilterMode.ON, withPrefix?: boolean, grouping?: AttachFilterGrouping): JoinClause;
export function attachFilter(db: Knex, qb: QueryBuilder | JoinClause, filter: Filter | boolean, mode: AttachFilterMode, withPrefix: boolean = true, grouping?: AttachFilterGrouping): QueryBuilder | JoinClause {
	let fn;
	if (mode === AttachFilterMode.ON) {
		fn = (qb as JoinClause)[getAttachFnName(mode, grouping)];
	} else {
		fn = (qb as QueryBuilder)[getAttachFnName(mode, grouping)];
	}

	if (typeof filter === "boolean") {
		if (filter) {
			return qb;
		} else {
			// @ts-ignore
			return fn.call(qb, db.raw("1 = 0"));
		}
	}

	const filterSql = filterToSql(db, filter, withPrefix);
	// @ts-ignore
	return fn.call(qb, db.raw(filterSql.sql, filterSql.getBindings(db)));
}

type JoinFnName = "andOn" | "orOn" | "on";
type WhereFnName = "andWhere" | "orWhere" | "where";

function getAttachFnName(mode: AttachFilterMode.WHERE, grouping?: AttachFilterGrouping): WhereFnName;
function getAttachFnName(mode: AttachFilterMode.ON, grouping?: AttachFilterGrouping): JoinFnName;
function getAttachFnName(mode: AttachFilterMode, grouping?: AttachFilterGrouping): JoinFnName | WhereFnName {
	if (mode === AttachFilterMode.ON) {
		if (grouping != null) {
			return (grouping === AttachFilterGrouping.AND ? "and" : "or") + "On" as JoinFnName;
		} else {
			return "on";
		}
	} else {
		if (grouping != null) {
			return (grouping === AttachFilterGrouping.AND ? "and" : "or") + "Where" as WhereFnName;
		} else {
			return "where";
		}
	}
}
