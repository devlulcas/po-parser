import { readFile } from 'node:fs/promises';
import { parsePoContent } from './parser.js';

async function parsePoFile(path: string) {
	const content = await readFile(path, 'utf8');
	return parsePoContent(content, path);
}

function iteratorToArray<T>(iterator: Iterator<T>): T[] {
	const array: T[] = [];
	let result = iterator.next();
	while (!result.done) {
		array.push(result.value);
		result = iterator.next();
	}
	return array;
}

const poFile = await parsePoFile('./fixtures/po/pt.po');
const poHeader = iteratorToArray(poFile.header);
const poBody = iteratorToArray(poFile.body);

console.group('poHeader');
console.log(poHeader);
console.groupEnd();

console.group('poBody');
console.log(poBody);
console.groupEnd();
