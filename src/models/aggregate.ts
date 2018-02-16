import * as Knex from "knex";

import { getDbDialect, wrapIdentifier } from "../utilities";

export type AggregateSql = (dialect: string, ...measureNames: string[]) => string;

export class Aggregate {
	constructor(public sql: AggregateSql) {

	}

	toSql(db: Knex | undefined, ...measureNames: string[]): string {
		const wrappedMeasureNames = measureNames.map((measureName) => wrapIdentifier(db, measureName));
		return this.sql(getDbDialect(db), ...wrappedMeasureNames);
	}
}

export const countAggregate = new Aggregate((_, measureName) => {
	return `COUNT(${ measureName != null ? measureName : "*" })`;
});

export const countDistinctAggregate = new Aggregate((_, ...measureNames) => {
	return `COUNT(DISTINCT ${ measureNames.join(", ") })`;
});

export const minAggregate = new Aggregate((_, measureName) => {
	return `MIN(${ measureName })`;
});

export const maxAggregate = new Aggregate((_, measureName) => {
	return `MAX(${ measureName })`;
});

export const sumAggregate = new Aggregate((_, measureName) => {
	return `SUM(${ measureName })`;
});

export const averageAggregate = new Aggregate((_, measureName) => {
	return `AVG(${ measureName })`;
});

export const averageDistinctAggregate = new Aggregate((_, measureName) => {
	return `AVG(DISTINCT ${ measureName })`;
});
