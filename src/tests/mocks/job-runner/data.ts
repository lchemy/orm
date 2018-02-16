import { Chance } from "chance";
import { Map } from "immutable";

import { db } from "./db";
import { Job, JobLog, Worker, WorkerMetrics } from "./models";

const BATCH_INSERT_LIMIT = 100;

export async function createTables(): Promise<void> {
	await db.raw(`
		CREATE TABLE jobs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			job_type_id INTEGER,
			name STRING
		);
	`);
	await db.raw(`
		CREATE TABLE job_logs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			job_id INTEGER,
			worker_id INTEGER,
			status STRING,
			duration NUMERIC
		);
	`);
	await db.raw(`
		CREATE TABLE workers (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name STRING
		);
	`);
	await db.raw(`
		CREATE TABLE jobs_workers (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			job_id INTEGER,
			worker_id INTEGER
		);
	`);
	await db.raw(`
		CREATE TABLE job_types (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name STRING
		);
	`);
}

export async function clearData(): Promise<void> {
	await db.raw(`
		DELETE FROM jobs;
	`);
	await db.raw(`
		DELETE FROM job_logs;
	`);
	await db.raw(`
		DELETE FROM workers;
	`);
	await db.raw(`
		DELETE FROM jobs_workers;
	`);
	await db.raw(`
		DELETE FROM job_types;
	`);
}

export async function deleteTables(): Promise<void> {
	await db.raw(`
		DROP TABLE IF EXISTS jobs;
	`);
	await db.raw(`
		DROP TABLE IF EXISTS job_logs;
	`);
	await db.raw(`
		DROP TABLE IF EXISTS workers;
	`);
	await db.raw(`
		DROP TABLE IF EXISTS jobs_workers;
	`);
	await db.raw(`
		DROP TABLE IF EXISTS job_types;
	`);
}

export interface Data {
	jobs: Job[];
	logs: JobLog[];
	workers: Worker[];

	jobMap: Map<number, Job>;
	logMap: Map<number, JobLog>;
	workerMap: Map<number, Worker>;
}

export async function mockData(seed: Chance.Seed = 0): Promise<Data> {
	const chance = new Chance(seed);

	// insert job types
	await db.batchInsert("job_types", [{
		id: 1,
		name: "SYSTEM"
	}, {
		id: 2,
		name: "SCHEDULED"
	}, {
		id: 3,
		name: "MANUAL"
	}], BATCH_INSERT_LIMIT);

	// generate jobs
	const jobsCount = chance.integer({ min: 10, max: 25 });
	const jobs = Array(jobsCount).fill(undefined).map((_, i) => {
		return {
			id: i + 1,
			type: chance.integer({ min: 1, max: 3 }),
			name: chance.string(),
			logs: [],
			logsByStatus: {
				pending: [],
				running: [],
				finished: []
			}
		} as Job;
	});

	// insert jobs
	await db.batchInsert("jobs", jobs.map((job) => {
		return {
			id: job.id,
			job_type_id: job.type,
			name: job.name
		};
	}), BATCH_INSERT_LIMIT);

	// generate workers
	const workersCount = chance.integer({ min: 5, max: 10 });
	const workers = Array(workersCount).fill(undefined).map((_, i) => {
		const workerJobs = chance.pickset(jobs, chance.integer({ min: 1, max: 5 })),
			workerJobIds = workerJobs.map((job) => job.id!);
		return {
			id: i + 1,
			name: chance.string(),
			jobs: workerJobs,
			jobIds: workerJobIds
		} as Worker;
	});

	// insert workers
	await db.batchInsert("workers", workers.map((worker) => {
		return {
			id: worker.id,
			name: worker.name
		};
	}), BATCH_INSERT_LIMIT);

	// insert jobs workers
	await db.batchInsert("jobs_workers", workers.reduce((memo, worker) => {
		worker.jobs!.forEach((job) => {
			memo.push({
				id: memo.length + 1,
				worker_id: worker.id,
				job_id: job.id
			});
		});
		return memo;
	}, [] as any[]), BATCH_INSERT_LIMIT);

	// generate logs
	const logsCount = chance.integer({ min: 50, max: 250 });
	const logs = Array(logsCount).fill(undefined).map((_, i) => {
		const id = i + 1,
			worker = chance.pick(workers),
			job = chance.pick(worker.jobs!),
			status = chance.pick(["PENDING", "RUNNING", "FINISHED"]),
			duration = status === "FINISHED" ? chance.floating({ min: 1, max: 60 }) : undefined,
			log = { id, job, worker, status, duration } as JobLog;

		job.logs!.push(log);
		(job.logsByStatus![status.toLowerCase() as "pending" | "running" | "finished"] as JobLog[]).push(log);

		return log;
	});

	// insert logs
	await db.batchInsert("job_logs", logs.map((log) => {
		return {
			id: log.id,
			job_id: log.job.id,
			worker_id: log.worker.id,
			status: log.status,
			duration: log.duration
		};
	}), BATCH_INSERT_LIMIT);

	// compute worker metrics
	workers.forEach((worker) => {
		worker.metrics = worker.jobs!.map((job) => {
			return job.logs!.filter((log) => {
				return log.worker.id === worker.id;
			}).reduce((memo, log) => {
				switch (log.status) {
					case "PENDING":
						memo.pending += 1;
						break;
					case "RUNNING":
						memo.running += 1;
						break;
					case "FINISHED":
						memo.finished += 1;
						break;
				}
				if (log.duration != null) {
					memo.duration += log.duration;
				}
				return memo;
			}, {
				worker,
				workerId: worker.id,
				job,
				jobId: job.id,
				pending: 0,
				running: 0,
				finished: 0,
				duration: 0
			} as WorkerMetrics);
		});
	});

	// get helper maps
	const jobMap = Map(jobs.map((job) => [job.id, job] as [number, Job])),
		logMap = Map(logs.map((log) => [log.id, log] as [number, JobLog])),
		workerMap = Map(workers.map((worker) => [worker.id, worker] as [number, Worker]));

	return {
		jobs,
		logs,
		workers,
		jobMap,
		logMap,
		workerMap
	};
}
