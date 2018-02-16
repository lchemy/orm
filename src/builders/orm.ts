import { List, Map, Set } from "immutable";

import { MAX_EAGER_ORM_DEPTH } from "../constants";
import { FieldExclusion } from "../enums";
import {
	AggregateOrm,
	ColumnField,
	Field,
	Filter,
	JoinField,
	JoinOneField,
	Orm,
	OrmRef,
	RelationalOrm,
	Schema,
	SchemaMapping,
	SchemaRef,
	makeComposite
} from "../models";
import {
	JoinFieldBuildersFactory,
	JoinManyFieldBuilder,
	JoinOneFieldBuilder,
	PartitionedJoinManyFieldBuilder,
	PluckedJoinManyFieldBuilder,
	PluckedJoinOneFieldBuilder
} from "../models/fields/join-fields/join-field-types";
import { defineLazyProperty, expandFields } from "../utilities";

import { AggregateFieldBuilder, AggregateFieldBuilderFactory, EndAggregateFieldBuilder, makeAggregateFieldBuilder } from "./aggregate-field";
import { ColumnFieldBuilder, ColumnFieldBuilderFactory, makeColumnFieldBuilder } from "./column-field";
import { DerivedFieldBuilder, DerivedFieldBuilderFactory, EndDerivedFieldBuilder, makeDerivedFieldBuilder } from "./derived-field";
import {
	JoinFieldBuilder,
	PartitionedJoinManyFieldBuilder as PartitionedJoinManyFieldBuilderCtor,
	PluckedJoinManyFieldBuilder as PluckedJoinManyFieldBuilderCtor,
	PluckedJoinOneFieldBuilder as PluckedJoinOneFieldBuilderCtor,
	makeJoinFieldBuilders
} from "./join-field";

export interface OrmDefinition<S extends SchemaMapping, O extends Orm> {
	id: number;
	type: "relation" | "aggregation";
	name: string;
	schema: Schema<S>;
	definer: OrmMappingDefiner<S, O>;
	auth?: OrmAuthFilter<O>;
}
export let definitions = Map<OrmRef<Orm>, OrmDefinition<SchemaMapping, Orm>>();

export interface RelationalOrmMappingDefinerArgs<S extends SchemaMapping, O extends Orm> {
	schema: Schema<S>;
	column: ColumnFieldBuilderFactory<O>;
	derive: DerivedFieldBuilderFactory<O>;
	join: JoinFieldBuildersFactory<O>;
}
export interface AggregateOrmMappingDefinerArgs<S extends SchemaMapping, O extends Orm> extends RelationalOrmMappingDefinerArgs<S, O> {
	aggregate: AggregateFieldBuilderFactory<O>;
}

export type RelationalOrmMappingDefiner<S extends SchemaMapping, O extends Orm> = (args: RelationalOrmMappingDefinerArgs<S, O>) => RelationalOrmMappingDefinition<O>;

export type RelationalOrmMappingDefinitionTypes<O extends Orm> = ColumnFieldBuilder<O, any> |
	EndDerivedFieldBuilder<O, any> |
	JoinOneFieldBuilder<O, Orm> |
	PluckedJoinOneFieldBuilder<O, Orm, any> |
	JoinManyFieldBuilder<O, Orm> |
	PartitionedJoinManyFieldBuilder<O, Orm, any> |
	PluckedJoinManyFieldBuilder<O, Orm, any>;
export interface RelationalOrmMappingDefinition<O extends Orm> {
	[key: string]: RelationalOrmMappingDefinitionTypes<O> | RelationalOrmMappingDefinition<O>;
}

export type AggregateOrmMappingDefiner<S extends SchemaMapping, O extends Orm> = (args: AggregateOrmMappingDefinerArgs<S, O>) => AggregateOrmMappingDefinition<O>;

export type AggregateOrmMappingDefinitionTypes<O extends Orm> = RelationalOrmMappingDefinitionTypes<O> |
	EndAggregateFieldBuilder<O, any>;
export interface AggregateOrmMappingDefinition<O extends Orm> {
	[key: string]: AggregateOrmMappingDefinitionTypes<O> | AggregateOrmMappingDefinition<O>;
}

export type OrmMappingDefiner<S extends SchemaMapping, O extends Orm> = AggregateOrmMappingDefiner<S, O> | RelationalOrmMappingDefiner<S, O>;
export type OrmMappingDefinition<O extends Orm> = AggregateOrmMappingDefinition<O> | RelationalOrmMappingDefinition<O>;

export type OrmAuthFilter<O extends Orm> = (auth: any, orm: O) => Filter | boolean;

export interface OrmBuilder<S extends SchemaMapping> {
	defineRelation: <O extends RelationalOrm>(name: string, definer: RelationalOrmMappingDefiner<S, O>, auth?: OrmAuthFilter<O>) => OrmRef<O>;
	defineAggregation: <O extends AggregateOrm>(name: string, definer: AggregateOrmMappingDefiner<S, O>, auth?: OrmAuthFilter<O>) => OrmRef<O>;
}

let ORM_ID: number = 0;
export function buildOrm<S extends SchemaMapping>(schemaRef: SchemaRef<S>): OrmBuilder<S> {
	const schema = schemaRef["🜅"];
	return {
		defineRelation: <O extends RelationalOrm>(name: string, definer: OrmMappingDefiner<S, O>, auth?: OrmAuthFilter<O>) => {
			const definition = {
				id: definitions.size + 1,
				type: "relation",
				name,
				schema,
				definer,
				auth
			} as OrmDefinition<S, O>;

			if (schema["🜃"].primaryKey.size === 0) {
				throw new Error(`Cannot use schema ${ schema } without primary key to define relational orm ${ name }`);
			}

			const ormRef = new OrmRef(() => {
				return buildOrmFromDefinition(definition) as O;
			});

			definitions = definitions.set(ormRef, definition as any);
			return ormRef;
		},
		defineAggregation: <O extends AggregateOrm>(name: string, definer: AggregateOrmMappingDefiner<S, O>, auth?: OrmAuthFilter<O>) => {
			const definition = {
				id: definitions.size + 1,
				type: "aggregation",
				name,
				schema,
				definer,
				auth
			} as OrmDefinition<S, O>;

			const ormRef = new OrmRef(() => {
				return buildOrmFromDefinition(definition) as O;
			});

			definitions = definitions.set(ormRef, definition as any);
			return ormRef;
		}
	};
}

export function buildOrmFromDefinition<S extends SchemaMapping, O extends Orm>({ id, type, name, schema, definer, auth }: OrmDefinition<S, O>): O {
	const orm = (type === "relation" ? new RelationalOrm() : new AggregateOrm()) as O,
		props = orm["🜀"];

	let mapping;
	if (type === "relation") {
		mapping = (definer as RelationalOrmMappingDefiner<S, O>)(getRelationalDefinerArgs(schema));
	} else {
		mapping = (definer as AggregateOrmMappingDefiner<S, O>)(getAggregateDefinerArgs(schema));
	}

	props.id = ORM_ID++;
	props.definitionId = id;
	props.name = name;
	props.schema = schema;
	props.path = List([name]);

	props.root = orm;
	props.base = orm;
	props.depth = 0;

	props.anonymous = false;

	if (auth != null) {
		props.auth = (a) => auth(a, orm);
	}

	const fields: Field[] = [],
		defaultFields: Field[] = [];

	scaffold(orm, orm, mapping, props.path, JoinType.EAGER, fields, defaultFields);

	props.fields = Set(fields);
	props.defaultFields = expandFields(defaultFields);
	props.primaryFields = getPrimaryFields(fields, orm);

	return orm;
}

export function buildJoinOrmFromDefinition<S extends SchemaMapping, O extends Orm>(
	{ id, type, name, schema, definer, auth }: OrmDefinition<S, O>,
	joinField: JoinField<O>
): O {
	const orm = (type === "relation" ? new RelationalOrm() : new AggregateOrm()) as O,
		props = orm["🜀"];

	let mapping;
	if (type === "relation") {
		mapping = (definer as RelationalOrmMappingDefiner<S, O>)(getRelationalDefinerArgs(schema));
	} else {
		mapping = (definer as AggregateOrmMappingDefiner<S, O>)(getAggregateDefinerArgs(schema));
	}

	const joinProps = joinField["🜁"];

	props.id = ORM_ID++;
	props.definitionId = id;
	props.name = name;
	props.schema = schema;
	props.path = joinProps.path;

	props.parent = joinProps.orm;

	const { root, base, depth } = props.parent["🜀"],
		isJoinOne = joinField instanceof JoinOneField;
	props.root = root;
	props.base = isJoinOne ? base : orm;
	props.depth = depth + 1;

	props.anonymous = false;

	if (isJoinOne && type === "aggregation") {
		throw new Error(`Cannot create join one field at ${ joinField } to aggregation orm`);
	}

	if (joinProps.auth != null) {
		props.auth = joinProps.auth;
	} else if (auth != null) {
		props.auth = (a) => auth(a, orm);
	}

	let joinType;
	if (props.depth >= MAX_EAGER_ORM_DEPTH || checkAncestorForId(props.parent, id)) {
		joinType = JoinType.LAZY;
	} else {
		joinType = JoinType.EAGER;
	}

	const fields: Field[] = [],
		defaultFields: Field[] = [];

	scaffold(orm, orm, mapping, props.path, joinType, fields, defaultFields);

	props.fields = Set(fields);
	props.defaultFields = expandFields(defaultFields);
	props.primaryFields = getPrimaryFields(fields, orm);

	return orm;
}

export function buildThroughOrmFromDefinition<S extends SchemaMapping, O extends Orm>(
	{ id, type, name, schema, definer }: OrmDefinition<S, O>,
	base: Orm,
	throughIndex: number
): O {
	if (type !== "relation") {
		throw new Error("Expected through orm to be a relation orm");
	}

	const orm = new RelationalOrm() as O,
		props = orm["🜀"],
		baseProps = base["🜀"],
		mapping = (definer as RelationalOrmMappingDefiner<S, O>)(getRelationalDefinerArgs(schema));

	props.id = ORM_ID++;
	props.definitionId = id;
	props.name = name;
	props.schema = schema;
	props.path = baseProps.path.concat(`through_${ name }_${ throughIndex }`);

	props.parent = baseProps.parent!;
	props.root = baseProps.root;
	props.base = baseProps.base;
	props.depth = baseProps.depth;

	props.anonymous = true;

	scaffold(orm, orm, mapping, props.path, JoinType.NONE);

	props.fields = Set();
	props.defaultFields = Set();

	return orm;
}

function checkAncestorForId(ancestor: Orm, id: number): boolean {
	const { definitionId, parent } = ancestor["🜀"];
	if (definitionId === id) {
		return true;
	}
	if (parent == null) {
		return false;
	}
	return checkAncestorForId(parent, id);
}

interface Scaffold {
	[key: string]: Field | Scaffold;
}

enum JoinType {
	EAGER,
	LAZY,
	NONE
}

function scaffold<O extends Orm, T extends Scaffold | Orm>(
	orm: O,
	target: T,
	tree: OrmMappingDefinition<O>,
	path: List<string>,
	joinType: JoinType,
	fields?: Field[],
	defaultFields?: Field[]
): void {
	Object.keys(tree).forEach((key) => {
		const node = tree[key],
			nodePath = path.concat(key);
		if (
			node instanceof JoinFieldBuilder ||
			node instanceof PluckedJoinOneFieldBuilderCtor ||
			node instanceof PartitionedJoinManyFieldBuilderCtor ||
			node instanceof PluckedJoinManyFieldBuilderCtor
		) {
			if (joinType === JoinType.EAGER) {
				type JoinFieldBuilderNodeType = JoinFieldBuilder<O, Orm> |
					PluckedJoinOneFieldBuilderCtor<O, Orm, any> |
					PartitionedJoinManyFieldBuilderCtor<O, Orm, string> |
					PluckedJoinManyFieldBuilderCtor<O, Orm, any>;

				const field = (node as JoinFieldBuilderNodeType).$build(orm, nodePath),
					fieldProps = field["🜁"];
				(target as any)[key] = field;

				if (fieldProps.exclusivity === FieldExclusion.INCLUDE && defaultFields != null) {
					defaultFields.push(field);
				}
				if (fields != null) {
					fields.push(field);
				}
			} else if (joinType === JoinType.LAZY) {
				defineLazyProperty(target, key, () => {
					return node.$build(orm, nodePath);
				});
			}
		} else if (node instanceof ColumnFieldBuilder || node instanceof DerivedFieldBuilder || node instanceof AggregateFieldBuilder) {
			const field = (node.$build as any)(orm, nodePath),
				fieldProps = field["🜁"];
			(target as any)[key] = field;

			if (fieldProps.exclusivity === FieldExclusion.INCLUDE && defaultFields != null) {
				defaultFields.push(field);
			}
			if (fields != null) {
				fields.push(field);
			}
		} else {
			const composite = makeComposite(),
				compositeProps = composite["🜂"];
			(target as any)[key] = composite;

			const compositeFields: Field[] | undefined = fields != null ? [] : undefined,
				compositeDefaultFields: Field[] | undefined = defaultFields != null ? [] : undefined;

			scaffold(orm, composite, node as OrmMappingDefinition<O>, nodePath, joinType, compositeFields, compositeDefaultFields);

			if (fields != null) {
				compositeProps.fields = Set(compositeFields!);
				fields.push.apply(fields, compositeFields);
			} else {
				compositeProps.fields = Set();
			}

			if (defaultFields != null) {
				compositeProps.defaultFields = expandFields(compositeDefaultFields!);
				defaultFields.push.apply(defaultFields, compositeDefaultFields);
			} else {
				compositeProps.defaultFields = Set();
			}
		}
	});
}

function getPrimaryFields(fields: Field[], orm: Orm): Set<ColumnField> {
	const primaryFields = Set(fields.filter((field) => {
		return field instanceof ColumnField && field["🜁"].primary;
	}) as ColumnField[]);

	const primaryKeyCheck = primaryFields.map((field) => field["🜁"].column);
	orm["🜀"].schema["🜃"].primaryKey.forEach((primaryKey) => {
		if (primaryKeyCheck.has(primaryKey)) {
			return;
		}
		throw new Error(`Expected ${ orm } to have primary key ${ primaryKey } in definition`);
	});

	return primaryFields;
}

function getRelationalDefinerArgs<S extends SchemaMapping, O extends Orm>(schema: Schema<S>): RelationalOrmMappingDefinerArgs<S, O> {
	return {
		schema,
		column: makeColumnFieldBuilder(),
		derive: makeDerivedFieldBuilder(),
		join: makeJoinFieldBuilders()
	};
}

function getAggregateDefinerArgs<S extends SchemaMapping, O extends Orm>(schema: Schema<S>): AggregateOrmMappingDefinerArgs<S, O> {
	return {
		...getRelationalDefinerArgs(schema),
		aggregate: makeAggregateFieldBuilder()
	};
}
