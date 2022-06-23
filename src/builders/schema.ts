import { Set } from "immutable";
import * as Knex from "knex";
import { QueryBuilder } from "knex";

import { Column, Schema, SchemaMapping, SchemaRef, Subquery, Table } from "../models";

import { ColumnBuilders, columnBuilders } from "./column";

export type SchemaDefinition<S extends SchemaMapping> = (column: ColumnBuilders) => S;
export type SchemaPrimarySelector<S extends SchemaMapping> = (schema: S) => Column | Column[];

export class StartSchemaBuilder {
	constructor(private db: Knex | Promise<Knex>) {
	}

	defineTable<S extends SchemaMapping>(table: string, definition: SchemaDefinition<S>): EndSchemaBuilder<S, Table<S>> {
		const schema = new Table<S>();
		schema["🜃"].table = table;
		this.initSchema(schema, definition);
		return new EndSchemaBuilder(schema);
	}

	defineSubquery<S extends SchemaMapping>(alias: string, subquery: (db: Knex) => QueryBuilder, definition: SchemaDefinition<S>): EndSchemaBuilder<S, Subquery<S>> {
		const schema = new Subquery<S>();
		schema["🜃"].alias = alias;
		schema["🜃"].subquery = subquery;
		this.initSchema(schema, definition);
		return new EndSchemaBuilder(schema);
	}

	private initSchema<S extends SchemaMapping>(schema: Schema<S>, definition: SchemaDefinition<S>): void {
		schema["🜃"].database = Promise.resolve(this.db);

		const columns = definition(columnBuilders);
		Object.keys(columns).forEach((key) => {
			const column = columns[key];
			// @ts-ignore
			schema[key] = column;
			column.schema = schema;
		});
	}
}

export class EndSchemaBuilder<S extends SchemaMapping, T extends Schema<S>> {
	constructor(private schema: T) {

	}

	useFullNames(): this {
		this.schema["🜃"].useFullNames = true;
		return this;
	}

	withoutPrimaryKey(): SchemaRef<S, T> {
		this.schema["🜃"].primaryKey = Set();
		return this.buildSchemaRef();
	}

	withPrimaryKey(selector: SchemaPrimarySelector<S>): SchemaRef<S, T> {
		// expand out primary key selector
		let primaryKey = selector(this.schema);
		if (!Array.isArray(primaryKey)) {
			primaryKey = [primaryKey];
		}

		// assign columns as primary for each primary key selected
		primaryKey.forEach((column) => {
			column.primary = true;
		});

		// update schema's primary
		this.schema["🜃"].primaryKey = Set(primaryKey);

		return this.buildSchemaRef();
	}

	private buildSchemaRef(): SchemaRef<S, T> {
		return new SchemaRef(this.schema);
	}
}

export function buildSchema(database: Knex | Promise<Knex>): StartSchemaBuilder {
	return new StartSchemaBuilder(database);
}
