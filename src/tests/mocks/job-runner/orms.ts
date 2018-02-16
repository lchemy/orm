import {
	AggregateField,
	AggregateOrm,
	ColumnField,
	DerivedField,
	JoinManyField,
	JoinOneField,
	OrmRef,
	PartitionedJoinManyField,
	PluckedJoinManyField,
	PluckedJoinOneField,
	RelationalOrm,
	buildOrm
} from "../../../index";

import { AuthUser } from "./models";
import { $jobLogsSchema, $jobTypesSchema, $jobsSchema, $jobsWorkersSchema, $workersSchema } from "./schemas";

export interface JobTypesOrm extends RelationalOrm {
	id: ColumnField<number>;
	name: ColumnField<string>;
}
export const $jobTypesOrm: OrmRef<JobTypesOrm> = buildOrm($jobTypesSchema).defineRelation("jobTypes", ({ column, schema }) => {
	return {
		id: column(schema.id),
		name: column(schema.name)
	};
});

export interface JobsOrm extends RelationalOrm {
	id: ColumnField<number>;
	typeId: ColumnField<number>;
	type: PluckedJoinOneField<JobTypesOrm, string>;
	derivedType: DerivedField<string>;
	name: ColumnField<string>;

	logs: JoinManyField<JobLogsOrm>;
	logsByStatus: PartitionedJoinManyField<JobLogsOrm, "pending" | "running" | "finished">;
}
export const $jobsOrm: OrmRef<JobsOrm> = buildOrm($jobsSchema).defineRelation("jobs", ({ column, derive, join, schema }) => {
	return {
		id: column(schema.id),
		typeId: column(schema.jobTypeId).exclude(),
		type: join.one($jobTypesOrm).on((job, type) => job.typeId.$eq(type.id)).pluck((type) => type.name),
		derivedType: derive(schema.jobTypeId).with((_, jobTypeId) => {
			return `CASE ${ jobTypeId } WHEN 1 THEN 'system' WHEN 2 THEN 'scheduled' WHEN 3 THEN 'manual' END`;
		}).asString(),
		name: column(schema.name),
		logs: join.many($jobLogsOrm).on((log, job) => log.jobId.$eq(job.id)).noAuth(),
		logsByStatus: join.many($jobLogsOrm).on((log, job) => log.jobId.$eq(job.id)).noAuth().partitionTo((orm) => {
			return {
				pending: orm.status.$eq("PENDING"),
				running: orm.status.$eq("RUNNING"),
				finished: orm.status.$eq("FINISHED")
			};
		})
	};
}, (auth: AuthUser, job) => {
	if (auth.isAdmin) {
		return true;
	}
	if (auth.jobIds != null) {
		return job.id.$in(...auth.jobIds);
	}
	return false;
});

export interface JobLogsOrm extends RelationalOrm {
	id: ColumnField<number>;
	jobId: ColumnField<number>;
	job: JoinOneField<JobsOrm>;
	workerId: ColumnField<number>;
	worker: JoinOneField<WorkersOrm>;
	status: ColumnField<string>;
	duration: ColumnField<number>;
}
export const $jobLogsOrm: OrmRef<JobLogsOrm> = buildOrm($jobLogsSchema).defineRelation("jobLogs", ({ column, join, schema }) => {
	return {
		id: column(schema.id),
		jobId: column(schema.jobId).alias((orm) => orm.job.id).exclude(),
		job: join.one($jobsOrm).on((log, job) => log.jobId.$eq(job.id)).noAuth(),
		workerId: column(schema.workerId).alias((orm) => orm.worker.id).exclude(),
		worker: join.one($workersOrm).on((log, worker) => log.workerId.$eq(worker.id)).noAuth(),
		status: column(schema.status),
		duration: column(schema.duration)
	};
}, (auth: AuthUser, log) => {
	if (auth.isAdmin) {
		return true;
	}
	if (auth.jobIds != null) {
		return log.jobId.$in(...auth.jobIds);
	}
	return false;
});

export interface WorkersOrm extends RelationalOrm {
	id: ColumnField<number>;
	name: ColumnField<string>;
	jobs: JoinManyField<JobsOrm>;
	jobIds: PluckedJoinManyField<JobsOrm, number>;
	metrics: JoinManyField<WorkerMetricsOrm>;
}
export const $workersOrm: OrmRef<WorkersOrm> = buildOrm($workersSchema).defineRelation("workers", ({ column, join, schema }) => {
	return {
		id: column(schema.id),
		name: column(schema.name),
		jobs: join.many($jobsOrm)
			.through($jobsWorkersOrm, (job, jobsWorkers) => jobsWorkers.jobId.$eq(job.id))
			.on((_, jobsWorkers, worker) => jobsWorkers.workerId.$eq(worker.id)),
		jobIds: join.many($jobsOrm)
			.through($jobsWorkersOrm, (job, jobsWorkers) => jobsWorkers.jobId.$eq(job.id))
			.on((_, jobsWorkers, worker) => jobsWorkers.workerId.$eq(worker.id))
			.pluck((job) => job.id),
		metrics: join.many($workerMetricsOrm).on((metrics, worker) => metrics.workerId.$eq(worker.id))
	};
}, (auth: AuthUser, worker) => {
	if (auth.isAdmin) {
		return true;
	}
	if (auth.jobIds != null) {
		return worker.jobs.$exists((job) => job.id.$in(...auth.jobIds!));
	}
	return false;
});

export interface JobsWorkersOrm extends RelationalOrm {
	id: ColumnField<number>;
	jobId: ColumnField<number>;
	job: JoinOneField<JobsOrm>;
	workerId: ColumnField<number>;
	worker: JoinOneField<WorkersOrm>;
}
export const $jobsWorkersOrm: OrmRef<JobsWorkersOrm> = buildOrm($jobsWorkersSchema).defineRelation("jobsWorkers", ({ column, join, schema }) => {
	return {
		id: column(schema.id),
		jobId: column(schema.jobId).alias((orm) => orm.job.id).exclude(),
		job: join.one($jobsOrm).on((jobsWorkers, job) => jobsWorkers.jobId.$eq(job.id)).noAuth(),
		workerId: column(schema.workerId).alias((orm) => orm.worker.id).exclude(),
		worker: join.one($workersOrm).on((jobsWorkers, worker) => jobsWorkers.workerId.$eq(worker.id)).noAuth()
	};
}, (auth: AuthUser, jobsWorkers) => {
	if (auth.isAdmin) {
		return true;
	}
	if (auth.jobIds != null) {
		return jobsWorkers.jobId.$in(...auth.jobIds!);
	}
	return false;
});

export interface WorkerMetricsOrm extends AggregateOrm {
	logId: ColumnField<number>;
	log: JoinOneField<JobLogsOrm>;
	jobId: ColumnField<number>;
	job: JoinOneField<JobsOrm>;
	workerId: ColumnField<number>;
	worker: JoinOneField<WorkersOrm>;
	pending: AggregateField<number>;
	running: AggregateField<number>;
	finished: AggregateField<number>;
	duration: AggregateField<number>;
}
export const $workerMetricsOrm: OrmRef<WorkerMetricsOrm> = buildOrm($jobLogsSchema).defineAggregation("workerMetrics", ({ aggregate, column, join, schema }) => {
	return {
		logId: column(schema.id).alias((orm) => orm.log.id).exclude(),
		log: join.one($jobsOrm).on((metrics, log) => metrics.logId.$eq(log.id)).noAuth().exclude(),
		jobId: column(schema.jobId).alias((orm) => orm.job.id),
		job: join.one($jobsOrm).on((metrics, job) => metrics.jobId.$eq(job.id)).noAuth().exclude(),
		workerId: column(schema.workerId).alias((orm) => orm.worker.id),
		worker: join.one($workersOrm).on((metrics, worker) => metrics.workerId.$eq(worker.id)).noAuth().exclude(),
		pending: aggregate(schema.status).with((_, s) => `SUM(CASE WHEN ${ s } = 'PENDING' THEN 1 ELSE 0 END)`).asInt().include(),
		running: aggregate(schema.status).with((_, s) => `SUM(CASE WHEN ${ s } = 'RUNNING' THEN 1 ELSE 0 END)`).asInt().include(),
		finished: aggregate(schema.status).with((_, s) => `SUM(CASE WHEN ${ s } = 'FINISHED' THEN 1 ELSE 0 END)`).asInt().include(),
		duration: aggregate(schema.duration).sum().asFloat().include()
	};
}, (auth: AuthUser, log) => {
	if (auth.isAdmin) {
		return true;
	}
	if (auth.jobIds != null) {
		return log.jobId.$in(...auth.jobIds);
	}
	return false;
});
