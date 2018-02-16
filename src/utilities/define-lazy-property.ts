export function defineLazyProperty(target: any, key: PropertyKey, getValue: () => any, enumerable: boolean = true): any {
	return Object.defineProperty(target, key, {
		get: () => {
			const value = getValue();
			Object.defineProperty(target, key, {
				value,
				configurable: true,
				enumerable
			});
			return value;
		},
		configurable: true,
		enumerable
	});
}
