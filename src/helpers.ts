export function iteratorToArray<T>(iterator: Iterator<T>): T[] {
	const array: T[] = [];
	let result = iterator.next();
	while (!result.done) {
		array.push(result.value);
		result = iterator.next();
	}
	return array;
}
