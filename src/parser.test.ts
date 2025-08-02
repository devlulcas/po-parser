import assert from 'node:assert';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { iteratorToArray } from './helpers.js';
import { parsePoContent } from './parser.js';

const fixtures = {
	pt: fileURLToPath(pathToFileURL('./fixtures/po/pt.po')),
	en: fileURLToPath(pathToFileURL('./fixtures/po/en.po'))
};

test('should parse a PO file', async () => {
	const path = fixtures.pt;

	const content = await readFile(path, 'utf8');

	const poFile = parsePoContent(content, path);

	const header = iteratorToArray(poFile.header);
	const body = iteratorToArray(poFile.body);

	console.log(header);
	console.log(body);

	assert.fail("I'm not sure about the current approach");
});

test('should handle the PO dir', async () => {
	// read the LINGUAS file
	// find the files for each language
	// check if they are valid PO files
	// parse them
	// return the parsed files as a map of language to parsed PO file
	// warn the user if there are no files for a language
	// warn the user if the translation is not complete
	assert.fail("I'm not sure about the current approach");
});
