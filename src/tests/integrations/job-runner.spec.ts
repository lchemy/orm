import {
	findAll,
	findAllWithCount,
	findCount,
	findOne,
	insertMany,
	insertOne,
	removeMany,
	removeOne,
	removeWithFilter,
	updateMany,
	updateOne,
	updateWithFilter
} from "../../requests";

import {
	$jobsOrm,
	$workersOrm,
	AuthUser,
	Data,
	Job,
	JobType,
	Worker,
	createTables,
	deleteTables,
	mockData
} from "../mocks/job-runner";

describe("job runner integration", () => {
	let data: Data;

	beforeEach(async () => {
		await createTables();
		data = await mockData();
	});

	afterEach(async () => {
		await deleteTables();
	});

	describe("workers", () => {
		it("should find all", async () => {
			const actualWorkers = await findAll($workersOrm) as Worker[];

			expect(actualWorkers).toHaveLength(data.workers.length);

			actualWorkers.forEach((actualWorker) => {
				const expectedWorker = data.workerMap.get(actualWorker.id!)!;
				expect(actualWorker.name).toBe(expectedWorker.name);
			});
		});

		it("should find one", async () => {
			const expectedWorker = data.workers[data.workers.length - 1];

			const actualWorker = await findOne($workersOrm, (orm) => {
				return {
					fields: [
						orm.id,
						orm.name,
						orm.jobs,
						orm.jobIds
					],
					filter: orm.id.$eq(expectedWorker.id!)
				};
			}) as Worker;

			expect(actualWorker.name).toBe(expectedWorker.name);
			expect(actualWorker.jobIds).toEqual(expectedWorker.jobIds);

			expect(actualWorker.jobs).toHaveLength(expectedWorker.jobs!.length);
			actualWorker.jobs!.forEach((actualJob) => {
				const expectedJob = expectedWorker.jobs!.find((job) => job.id === actualJob.id);
				expect(expectedJob).toBeDefined();
			});
		});

		it("should find all with count", async () => {
			const results = await findAllWithCount($workersOrm, () => {
				return {
					pagination: {
						offset: data.workers.length - 2,
						limit: 1
					}
				};
			});

			expect(results.rows).toHaveLength(1);
			expect(results.count).toBe(data.workers.length);
		});

		it("should find count", async () => {
			const actualCount = await findCount($workersOrm, (orm) => {
				return {
					filter: orm.name.$like("%a%")
				};
			});

			const expectedCount = data.workers.filter((worker) => worker.name.toLowerCase().includes("a")).length;

			expect(actualCount).toBe(expectedCount);
		});

		it("should find all with metrics", async () => {
			const actualWorkers = await findAll($workersOrm, (orm) => {
				return {
					fields: [
						orm.id,
						orm.name,
						orm.metrics
					]
				};
			}) as Worker[];

			expect(actualWorkers).toHaveLength(data.workers.length);

			actualWorkers.forEach((actualWorker) => {
				const expectedWorker = data.workerMap.get(actualWorker.id!)!;
				expect(actualWorker.name).toBe(expectedWorker.name);

				actualWorker.metrics!.forEach((actualMetrics) => {
					const expectedMetrics = expectedWorker.metrics!.find((m) => m.job.id === actualMetrics.jobId)!;
					expect(actualMetrics.pending).toBe(expectedMetrics.pending);
					expect(actualMetrics.running).toBe(expectedMetrics.running);
					expect(actualMetrics.finished).toBe(expectedMetrics.finished);
					expect(actualMetrics.duration).toBeCloseTo(expectedMetrics.duration);
				});
			});
		});

		it("should find all with auth", async () => {
			const actualAdminWorkers = await findAll($workersOrm, () => {
				return {
					auth: {
						isAdmin: true,
						jobIds: [-1]
					} as AuthUser
				};
			}) as Worker[];

			expect(actualAdminWorkers).toHaveLength(data.workers.length);

			const jobIds = data.jobs.splice(0, 2).map((job) => job.id);

			const actualAuthWorkers = await findAll($workersOrm, (orm) => {
				return {
					fields: [
						orm.id,
						orm.metrics.pending,
						orm.metrics.running,
						orm.metrics.finished,
						orm.metrics.duration
					],
					auth: {
						isAdmin: false,
						jobIds
					} as AuthUser
				};
			}) as Worker[];

			const expectedAuthWorkers = data.workers.filter((worker) => {
				return worker.jobs!.some((job) => jobIds.includes(job.id));
			});

			expect(actualAuthWorkers).toHaveLength(expectedAuthWorkers.length);

			actualAuthWorkers.forEach((actualWorker) => {
				const expectedWorker = data.workerMap.get(actualWorker.id!)!;

				const actualFullMetrics = actualWorker.metrics![0];

				const expectedFullMetrics = expectedWorker.jobs!.map((job) => job.logs!).reduce((memo, logs) => {
					return memo.concat(logs);
				}, []).filter((log) => {
					return jobIds.includes(log.job.id) && log.worker.id === actualWorker.id;
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
					if (log.duration! > 0) {
						memo.duration += log.duration!;
					}
					return memo;
				}, {
					pending: 0,
					running: 0,
					finished: 0,
					duration: 0
				});

				expect(actualFullMetrics.pending).toBe(expectedFullMetrics.pending);
				expect(actualFullMetrics.running).toBe(expectedFullMetrics.running);
				expect(actualFullMetrics.finished).toBe(expectedFullMetrics.finished);
				expect(actualFullMetrics.duration).toBeCloseTo(expectedFullMetrics.duration);
			});
		});

		it("should insert many", async () => {
			const insertedWorkers = await insertMany($workersOrm, (orm) => {
				return {
					fields: [
						orm.name
					],
					items: [{
						name: "hello"
					}, {
						name: "world"
					}]
				};
			}) as Worker[];

			expect(insertedWorkers).toHaveLength(2);

			insertedWorkers.forEach((insertedWorker) => {
				expect(data.workerMap.has(insertedWorker.id!)).toBeFalsy();
			});

			const fullInsertedWorkers = await findAll($workersOrm, (orm) => {
				return {
					filter: orm.id.$in(...insertedWorkers.map((w) => w.id!))
				};
			}) as Worker[];

			expect(fullInsertedWorkers.find((w) => w.name === "hello")).toBeDefined();
			expect(fullInsertedWorkers.find((w) => w.name === "world")).toBeDefined();
		});

		it("should insert one", async () => {
			const insertedWorker = await insertOne($workersOrm, (orm) => {
				return {
					fields: [
						orm.name
					],
					item: {
						name: "hello world"
					}
				};
			}) as Worker;

			expect(insertedWorker).toBeDefined();

			const fullInsertedWorker = await findOne($workersOrm, (orm) => {
				return {
					filter: orm.id.$eq(insertedWorker.id!)
				};
			}) as Worker;

			expect(fullInsertedWorker).toBeDefined();
			expect(fullInsertedWorker.name).toBe("hello world");
		});

		it("should update many", async () => {
			const updateIds = data.workers.slice(0, data.workers.length / 2 | 0).map((worker) => worker.id!);

			const updatedCount = await updateMany($workersOrm, (orm) => {
				return {
					fields: [
						orm.name
					],
					items: updateIds.map((id) => {
						return {
							id,
							name: `Worker ${ id }`
						};
					})
				};
			});

			expect(updatedCount).toBe(updateIds.length);

			const updatedWorkers = await findAll($workersOrm, (orm) => {
				return {
					fields: [
						orm.id,
						orm.name
					],
					filter: orm.id.$in(...updateIds)
				};
			}) as Worker[];

			expect(updatedWorkers).toHaveLength(updateIds.length);

			updatedWorkers.forEach((worker) => {
				expect(worker.name).toBe(`Worker ${ worker.id }`);
			});
		});

		it("should update one", async () => {
			const workerId = data.workers[0].id!;

			const isUpdated = await updateOne($workersOrm, (orm) => {
				return {
					fields: [
						orm.name
					],
					item: {
						id: workerId,
						name: "hello world"
					}
				};
			});

			expect(isUpdated).toBeTruthy();

			const updatedWorker = await findOne($workersOrm, (orm) => {
				return {
					fields: [
						orm.id,
						orm.name
					],
					filter: orm.id.$eq(workerId)
				};
			}) as Worker;

			expect(updatedWorker).toBeDefined();
			expect(updatedWorker.name).toBe("hello world");
		});

		it("should update with filter", async () => {
			const updateIds = data.workers.slice(0, data.workers.length / 2 | 0).map((worker) => worker.id!);

			const updatedCount = await updateWithFilter($workersOrm, (orm) => {
				return {
					values: [{
						field: orm.name,
						value: "yo!"
					}],
					filter: orm.id.$in(...updateIds),
					expected: null
				};
			});

			expect(updatedCount).toBe(updateIds.length);

			const findUpdatedCount = await findCount($workersOrm, (orm) => {
				return {
					filter: orm.name.$eq("yo!")
				};
			});

			expect(findUpdatedCount).toBe(updateIds.length);
		});

		it("should update with filter with expected", async () => {
			const updateIds = data.workers.slice(0, data.workers.length / 2 | 0).map((worker) => worker.id!);

			const updatedWithWrongExpected = updateWithFilter($workersOrm, (orm) => {
				return {
					values: [{
						field: orm.name,
						value: "yo!"
					}],
					filter: orm.id.$in(...updateIds),
					expected: 0
				};
			});
			await expect(updatedWithWrongExpected).rejects.toThrow();

			const updatedWithExpected = updateWithFilter($workersOrm, (orm) => {
				return {
					values: [{
						field: orm.name,
						value: "yo!"
					}],
					filter: orm.id.$in(...updateIds),
					expected: updateIds.length
				};
			});
			await expect(updatedWithExpected).resolves.toBe(updateIds.length);
		});

		it("should update many with auth", async () => {
			const jobId = data.jobs[0].id!,
				updateIds = Array.from(new Set(data.jobs[0].logs!.map((log) => log.worker.id!)));

			const updatedCount = await updateMany($workersOrm, (orm) => {
				return {
					fields: [
						orm.name
					],
					items: updateIds.map((id) => {
						return {
							id,
							name: `Worker ${ id }`
						};
					}),
					auth: {
						isAdmin: false,
						jobIds: [jobId]
					}
				};
			});

			expect(updatedCount).toBe(updateIds.length);

			const updatedWorkers = await findAll($workersOrm, (orm) => {
				return {
					fields: [
						orm.id,
						orm.name
					],
					filter: orm.id.$in(...updateIds)
				};
			}) as Worker[];

			expect(updatedWorkers).toHaveLength(updateIds.length);

			updatedWorkers.forEach((worker) => {
				expect(worker.name).toBe(`Worker ${ worker.id }`);
			});
		});

		it("should fail to update too many with auth", async () => {
			const jobId = data.jobs[0].id!,
				updateIds = Array.from(new Set(data.jobs[0].logs!.map((log) => log.worker.id!)));

			const updateTooMany = updateMany($workersOrm, (orm) => {
				return {
					fields: [
						orm.name
					],
					items: data.workers.map((worker) => {
						return {
							id: worker.id,
							name: `Worker ${ worker.id }`
						};
					}),
					auth: {
						isAdmin: false,
						jobIds: [jobId]
					}
				};
			});

			if (data.workers.length !== updateIds.length) {
				await expect(updateTooMany).rejects.toThrow();
			} else {
				// pick a different seed?
			}
		});

		it("should remove many", async () => {
			const removeIds = data.workers.slice(0, data.workers.length / 2 | 0).map((worker) => worker.id!);

			const removedCount = await removeMany($workersOrm, () => {
				return {
					items: removeIds.map((id) => {
						return { id };
					})
				};
			});

			expect(removedCount).toBe(removeIds.length);

			const tryToFindRemoved = await findAll($workersOrm, (orm) => {
				return {
					fields: [
						orm.id
					],
					filter: orm.id.$in(...removeIds)
				};
			});

			expect(tryToFindRemoved).toHaveLength(0);
		});

		it("should remove one", async () => {
			const workerId = data.workers[0].id!;

			const isRemoved = await removeOne($workersOrm, () => {
				return {
					item: {
						id: workerId
					}
				};
			});

			expect(isRemoved).toBeTruthy();

			const tryToFindRemoved = await findOne($workersOrm, (orm) => {
				return {
					fields: [
						orm.id
					],
					filter: orm.id.$eq(workerId)
				};
			});

			expect(tryToFindRemoved).toBeUndefined();
		});

		it("should remove with filter", async () => {
			const removeIds = data.workers.slice(0, data.workers.length / 2 | 0).map((worker) => worker.id!);

			const removedCount = await removeWithFilter($workersOrm, (orm) => {
				return {
					filter: orm.id.$in(...removeIds),
					expected: null
				};
			});

			expect(removedCount).toBe(removeIds.length);

			const tryToFindRemoved = await findAll($workersOrm, (orm) => {
				return {
					filter: orm.id.$in(...removeIds)
				};
			});

			expect(tryToFindRemoved).toHaveLength(0);
		});

		it("should remove with filter with expected", async () => {
			const removeIds = data.workers.slice(0, data.workers.length / 2 | 0).map((worker) => worker.id!);

			const removedWithWrongExpected = removeWithFilter($workersOrm, (orm) => {
				return {
					filter: orm.id.$in(...removeIds),
					expected: 0
				};
			});
			await expect(removedWithWrongExpected).rejects.toThrow();

			const removedWithExpected = removeWithFilter($workersOrm, (orm) => {
				return {
					filter: orm.id.$in(...removeIds),
					expected: removeIds.length
				};
			});
			await expect(removedWithExpected).resolves.toBe(removeIds.length);
		});

		it("should remove many with auth", async () => {
			const jobId = data.jobs[0].id!,
				removeIds = Array.from(new Set(data.jobs[0].logs!.map((log) => log.worker.id!)));

			const removedCount = await removeMany($workersOrm, () => {
				return {
					items: removeIds.map((id) => {
						return {
							id,
							name: `Worker ${ id }`
						};
					}),
					auth: {
						isAdmin: false,
						jobIds: [jobId]
					}
				};
			});

			expect(removedCount).toBe(removeIds.length);

			const tryToFindRemoved = await findAll($workersOrm, (orm) => {
				return {
					fields: [
						orm.id,
						orm.name
					],
					filter: orm.id.$in(...removeIds)
				};
			}) as Worker[];

			expect(tryToFindRemoved).toHaveLength(0);
		});

		it("should fail to remove too many with auth", async () => {
			const jobId = data.jobs[0].id!,
				removeIds = Array.from(new Set(data.jobs[0].logs!.map((log) => log.worker.id!)));

			const removeTooMany = removeMany($workersOrm, () => {
				return {
					items: data.workers.map((worker) => {
						return {
							id: worker.id,
							name: `Worker ${ worker.id }`
						};
					}),
					auth: {
						isAdmin: false,
						jobIds: [jobId]
					}
				};
			});

			if (data.workers.length !== removeIds.length) {
				await expect(removeTooMany).rejects.toThrow();
			} else {
				// pick a different seed?
			}
		});
	});

	describe("jobs", () => {
		it("should find all", async () => {
			const actualJobs = await findAll($jobsOrm, (orm) => {
				return {
					fields: [
						orm.id,
						orm.name,
						orm.type,
						orm.typeId,
						orm.derivedType,
						orm.logs,
						orm.logsByStatus,
					]
				};
			}) as Job[];

			actualJobs.forEach((actualJob) => {
				const expectedJob = data.jobMap.get(actualJob.id!)!;

				// check that type, typeId, and derivedType are all consistent
				expect(actualJob.type).toBe(JobType[actualJob.typeId]);
				expect(actualJob.derivedType).toBe(actualJob.type.toLowerCase());

				// check that logs match
				expectedJob.logs!.forEach((expectedLog) => {
					const actualLog = actualJob.logs!.find((log) => log.id === expectedLog.id)!;
					expect(actualLog).toBeDefined();
				});

				// check that logs by status matches
				(Object.keys(actualJob.logsByStatus!) as Array<"pending" | "running" | "finished">).forEach((key) => {
					const actualJobLogsByStatus = actualJob.logsByStatus![key];
					expect(actualJobLogsByStatus).toHaveLength(expectedJob.logsByStatus![key].length);

					actualJobLogsByStatus.forEach((actualLog) => {
						expect(actualLog.status).toBe(key.toUpperCase());
					});
				});
			});
		});
	});
});
