import { List } from "immutable";
import * as Knex from "knex";

import {
	AndFilterGroup,
	BetweenFilterNode,
	ColumnField,
	ColumnFilterNode,
	CountManyEqualFilterNode,
	CountManyGreaterThanEqualFilterNode,
	CountManyGreaterThanFilterNode,
	CountManyLessThanEqualFilterNode,
	CountManyLessThanFilterNode,
	CountManyNotEqualFilterNode,
	DerivedField,
	EqualFilterNode,
	ExistsManyFilterNode,
	ExistsOneFilterNode,
	Filter,
	FilterGroup,
	FilterSql,
	GreaterThanEqualFilterNode,
	GreaterThanFilterNode,
	ILikeFilterNode,
	InFilterNode,
	IsNotNullFilterNode,
	IsNullFilterNode,
	JoinCountManyFilterNode,
	JoinExistsManyFilterNode,
	JoinExistsOneFilterNode,
	LessThanEqualFilterNode,
	LessThanFilterNode,
	LikeFilterNode,
	NotBetweenFilterNode,
	NotEqualFilterNode,
	NotExistsManyFilterNode,
	NotExistsOneFilterNode,
	NotILikeFilterNode,
	NotInFilterNode,
	NotLikeFilterNode
} from "../models";

import { buildJoinQuery } from "./build-join-query";
import { wrapIdentifier } from "./wrap-identifier";

export function filterToSql(db: Knex | undefined, filter: Filter, withPrefix: boolean = true): FilterSql {
	if (filter instanceof FilterGroup) {
		return filterGroupToSql(db, filter, withPrefix);
	} else if (filter instanceof ColumnFilterNode) {
		return columnFilterNodeToSql(db, filter, withPrefix);
	} else if (filter instanceof JoinCountManyFilterNode) {
		return joinCountManyFilterNodeToSql(db, filter, withPrefix);
	} else if (filter instanceof JoinExistsOneFilterNode) {
		return joinExistsOneFilterNodeToSql(db, filter);
	} else if (filter instanceof JoinExistsManyFilterNode) {
		return joinExistsManyFilterNodeToSql(db, filter);
	} else {
		throw new Error(`Unexpected filter`);
	}
}

function filterGroupToSql(db: Knex | undefined, filter: FilterGroup, withPrefix: boolean = true): FilterSql {
	if (filter.expressions.length === 1) {
		return filterToSql(db, filter.expressions[0], withPrefix);
	}

	const grouping = filter instanceof AndFilterGroup ? "AND" : "OR";

	const sqls = filter.expressions.map((expr) => filterToSql(db, expr, withPrefix)),
		sql = sqls.map((s) => `(${ s.sql })`).join(` ${ grouping } `),
		bindings = sqls.map((s) => s.bindings).reduce((prev, curr) => prev.concat(curr));

	return new FilterSql(sql, bindings);
}

function columnFilterNodeToSql(db: Knex | undefined, filter: ColumnFilterNode, withPrefix: boolean = true): FilterSql {
	let sqlTemplate: string,
		values: any[];

	if (filter instanceof EqualFilterNode) {
		sqlTemplate = "? = ?";
		values = [filter.left, filter.right];
	} else if (filter instanceof NotEqualFilterNode) {
		sqlTemplate = "? != ?";
		values = [filter.left, filter.right];
	} else if (filter instanceof GreaterThanFilterNode) {
		sqlTemplate = "? > ?";
		values = [filter.left, filter.right];
	} else if (filter instanceof GreaterThanEqualFilterNode) {
		sqlTemplate = "? >= ?";
		values = [filter.left, filter.right];
	} else if (filter instanceof LessThanFilterNode) {
		sqlTemplate = "? < ?";
		values = [filter.left, filter.right];
	} else if (filter instanceof LessThanEqualFilterNode) {
		sqlTemplate = "? <= ?";
		values = [filter.left, filter.right];
	} else if (filter instanceof LikeFilterNode) {
		sqlTemplate = "? LIKE ?";
		values = [filter.left, filter.right];
	} else if (filter instanceof NotLikeFilterNode) {
		sqlTemplate = "? NOT LIKE ?";
		values = [filter.left, filter.right];
	} else if (filter instanceof ILikeFilterNode) {
		sqlTemplate = "? ILIKE ?";
		values = [filter.left, filter.right];
	} else if (filter instanceof NotILikeFilterNode) {
		sqlTemplate = "? NOT ILIKE ?";
		values = [filter.left, filter.right];
	} else if (filter instanceof BetweenFilterNode) {
		sqlTemplate = "? BETWEEN ? AND ?";
		values = [filter.left, ...filter.right];
	} else if (filter instanceof NotBetweenFilterNode) {
		sqlTemplate = "? NOT BETWEEN ? AND ?";
		values = [filter.left, ...filter.right];
	} else if (filter instanceof InFilterNode) {
		sqlTemplate = "? IN (??)";
		values = [filter.left, filter.right];
	} else if (filter instanceof NotInFilterNode) {
		sqlTemplate = "? NOT IN (??)";
		values = [filter.left, filter.right];
	} else if (filter instanceof IsNullFilterNode) {
		sqlTemplate = "? IS NULL";
		values = [filter.left, filter.right];
	} else if (filter instanceof IsNotNullFilterNode) {
		sqlTemplate = "? IS NOT NULL";
		values = [filter.left, filter.right];
	} else {
		throw new Error(`Unexpected filter node`);
	}

	let i = 0,
		bindings = List<any>();
	const l = values.length;

	const mapField = (value: any): string => {
		if (value instanceof DerivedField) {
			return value["🜁"].getFieldSql(db, withPrefix);
		} else if (value instanceof ColumnField) {
			if (withPrefix) {
				return wrapIdentifier(db, value["🜁"].fieldName);
			} else {
				return value["🜁"].column.name;
			}
		} else {
			bindings = bindings.push(value);
			return "?";
		}
	};

	const sql = sqlTemplate.replace(/\?{1,2}/g, (match) => {
		if (i >= l) {
			// too many question marks, not enough arguments provided
			throw new Error(`Number of sql parameters does not match provided parameters: ${ sqlTemplate } with ${ values }`);
		}

		if (match === "??") {
			const arr = values[i++];
			if (!Array.isArray(arr)) {
				throw new Error(`Expected sql binding value to be an array`);
			}
			return arr.map(mapField).join(", ");
		} else {
			return mapField(values[i++]);
		}
	});

	return new FilterSql(sql, bindings);
}

// TODO: clean this up?
function joinCountManyFilterNodeToSql(db: Knex | undefined, filter: JoinCountManyFilterNode, withPrefix: boolean = true): FilterSql {
	if (db == null) {
		throw new Error(`Cannot create join count many filter with no database object`);
	}

	const countValue = filter.count;

	let comparison: string;
	if (filter instanceof CountManyEqualFilterNode) {
		comparison = "=";
	} else if (filter instanceof CountManyNotEqualFilterNode) {
		comparison = "!=";
	} else if (filter instanceof CountManyGreaterThanFilterNode) {
		comparison = ">";
	} else if (filter instanceof CountManyGreaterThanEqualFilterNode) {
		comparison = ">=";
	} else if (filter instanceof CountManyLessThanFilterNode) {
		comparison = "<";
	} else if (filter instanceof CountManyLessThanEqualFilterNode) {
		comparison = "<=";
	} else {
		throw new Error(`Unexpected join count many filter ${ filter }`);
	}

	const subquery = buildJoinQuery(db, db.select(), filter.field);
	subquery.count("* AS count");

	const { sql: subquerySql, bindings: subqueryBindings } = subquery.toSQL();

	let filterSql: FilterSql;
	if (countValue instanceof DerivedField) {
		const fieldSql = countValue["🜁"].getFieldSql(db, withPrefix);
		filterSql = new FilterSql(`(${ subquerySql }) ${ comparison } (${ fieldSql })`, List(subqueryBindings));
	} else if (countValue instanceof ColumnField) {
		let fieldName: string;
		if (withPrefix) {
			fieldName = wrapIdentifier(db, countValue["🜁"].fieldName);
		} else {
			fieldName = countValue["🜁"].column.name;
		}
		filterSql = new FilterSql(`(${ subquerySql }) ${ comparison } (${ fieldName })`, List(subqueryBindings));
	} else {
		filterSql = new FilterSql(`(${ subquerySql }) ${ comparison } ?`, List([...subqueryBindings, countValue]));
	}

	return filterSql;
}

// TODO: clean this up?
function joinExistsOneFilterNodeToSql(db: Knex | undefined, filter: JoinExistsOneFilterNode): FilterSql {
	if (db == null) {
		throw new Error(`Cannot create join exists one filter with no database object`);
	}

	const subquery = buildJoinQuery(db, db.select(), filter.field),
		{ sql: subquerySql, bindings: subqueryBindings } = subquery.toSQL();

	let op: string;
	if (filter instanceof ExistsOneFilterNode) {
		op = "EXISTS";
	} else if (filter instanceof NotExistsOneFilterNode) {
		op = "NOT EXISTS";
	} else {
		throw new Error(`Unexpected join exists one filter ${ filter }`);
	}

	return new FilterSql(`${ op } (${ subquerySql })`, List(subqueryBindings));
}

// TODO: clean this up?
function joinExistsManyFilterNodeToSql(db: Knex | undefined, filter: JoinExistsManyFilterNode): FilterSql {
	if (db == null) {
		throw new Error(`Cannot create join exists many filter with no database object`);
	}

	const subquery = buildJoinQuery(db, db.select(), filter.field);

	if (filter.value != null) {
		const { sql: filterSql, bindings: filterBindings } = filterToSql(db, filter.value);
		subquery.whereRaw(filterSql, filterBindings.toArray());
	}

	const { sql: subquerySql, bindings: subqueryBindings } = subquery.toSQL();

	let op: string;
	if (filter instanceof ExistsManyFilterNode) {
		op = "EXISTS";
	} else if (filter instanceof NotExistsManyFilterNode) {
		op = "NOT EXISTS";
	} else {
		throw new Error(`Unexpected join exists many filter ${ filter }`);
	}

	return new FilterSql(`${ op } (${ subquerySql })`, List(subqueryBindings));
}
