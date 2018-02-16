import { defineLazyProperty } from "./define-lazy-property";

describe("define lazy property", () => {
	it("should lazily evaluate the value", () => {
		const obj = {} as any;

		let called = 0;
		defineLazyProperty(obj, "a", () => {
			called++;
		});

		expect(called).toBe(0);
		obj.a; // tslint:disable-line:no-unused-expression
		expect(called).toBe(1);
	});

	it("should only evaluate the value once", () => {
		const obj = {} as any;

		defineLazyProperty(obj, "a", () => {
			return Symbol();
		});

		const firstValue = obj.a,
			secondValue = obj.a;
		expect(firstValue).toBe(secondValue);
	});
});
