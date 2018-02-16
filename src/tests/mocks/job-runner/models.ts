export interface AuthUser {
	isAdmin?: boolean;
	jobIds?: number[];
}

export enum JobType {
	SYSTEM = 1,
	SCHEDULED = 2,
	MANUAL = 3
}

export interface Job {
	id?: number;
	typeId: JobType;
	type: string;
	derivedType: string;
	name: string;

	logs?: JobLog[];
	logsByStatus?: {
		pending: JobLog[],
		running: JobLog[],
		finished: JobLog[]
	};
}

export interface JobLog {
	id?: number;
	job: Job;
	worker: Worker;
	status: "PENDING" | "RUNNING" | "FINISHED";
	duration?: number;
}

export interface Worker {
	id?: number;
	name: string;

	jobs?: Job[];
	jobIds?: number[];
	metrics?: WorkerMetrics[];
}

export interface WorkerMetrics {
	workerId: number;
	worker: Worker;
	jobId: number;
	job: Job;
	pending: number;
	running: number;
	finished: number;
	duration: number;
}
