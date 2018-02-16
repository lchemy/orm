import { unflatten } from "./unflatten";

describe("unflatten", () => {
	it("should unflatten a flat object separated by $", () => {
		expect(unflatten({
			a$b$c: 2,
			a$c: 1,
			b: 3,
			c: null,
			d: undefined
		})).toEqual({
			a: {
				b: {
					c: 2
				},
				c: 1
			},
			b: 3,
			c: null,
			d: undefined
		});
	});

	it("should ignore properties that start with __", () => {
		expect(unflatten({
			__a: 1,
			a$__b: 2,
			a$c$__d$e: 3,
			a$c$e: 4
		})).toEqual({
			a: {
				c: {
					e: 4
				}
			}
		});
	});

	it("should handle nested object structures", () => {
		expect(unflatten({
			a$b: {
				c$d: 1
			},
			a$c: [{
				d$e: 2
			}, {
				d$e: 3
			}]
		})).toEqual({
			a: {
				b: {
					c: {
						d: 1
					}
				},
				c: [{
					d: {
						e: 2
					}
				}, {
					d: {
						e: 3
					}
				}]
			}
		});
	});
});
