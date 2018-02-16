import { buildSchema } from "../../../index";

import { db } from "./db";

export const $jobsSchema = buildSchema(db).defineTable("jobs", (column) => {
	return {
		id: column.int("id"),
		jobTypeId: column.int("job_type_id"),
		name: column.string("name")
	};
}).useFullNames().withPrimaryKey((schema) => schema.id);

export const $jobLogsSchema = buildSchema(db).defineTable("job_logs", (column) => {
	return {
		id: column.int("id"),
		jobId: column.int("job_id"),
		workerId: column.int("worker_id"),
		status: column.string("status"),
		duration: column.float("duration")
	};
}).useFullNames().withPrimaryKey((schema) => schema.id);

export const $workersSchema = buildSchema(db).defineTable("workers", (column) => {
	return {
		id: column.int("id"),
		name: column.string("name")
	};
}).useFullNames().withPrimaryKey((schema) => schema.id);

export const $jobsWorkersSchema = buildSchema(db).defineTable("jobs_workers", (column) => {
	return {
		id: column.int("id"),
		jobId: column.int("job_id"),
		workerId: column.int("worker_id")
	};
}).useFullNames().withPrimaryKey((schema) => schema.id);

export const $jobTypesSchema = buildSchema(db).defineTable("job_types", (column) => {
	return {
		id: column.int("id"),
		name: column.string("name")
	};
}).useFullNames().withPrimaryKey((schema) => schema.id);
