let LINE_INDEX = 0;
let FILE_PATH = '';

export class PoParseError extends Error {
	constructor(
		message: string,
		options: {
			cause: string;
			expected: string;
			actual: string;
		}
	) {
		super(message, { cause: options.cause });
		this.index = LINE_INDEX;
		this.expected = options.expected;
		this.actual = options.actual;
		this.name = 'PoParseError';
		this.file = FILE_PATH;
		this.see = FILE_PATH + ':' + this.index + ':0';
	}

	index: number;
	expected: string;
	actual: string;
	file: string;
	see: string;
}

const TOKENS = {
	comment: {
		prefix: '#',
		type: 'comment',
		variations: [
			{ prefix: ' ', type: 'translator' },
			{ prefix: ':', type: 'reference' },
			{ prefix: ',', type: 'flag' },
			{ prefix: '.', type: 'extracted' },
			{ prefix: '|', type: 'previousUntranslatedString' }
		]
	},
	msgid: {
		prefix: 'msgid',
		type: 'msgid',
		variations: null
	},
	msgstr: {
		prefix: 'msgstr',
		type: 'msgstr',
		variations: null
	},
	whitespace: {
		prefix: null,
		type: 'whitespace',
		variations: null
	},
	eof: {
		prefix: null,
		type: 'eof',
		variations: null
	}
} as const satisfies Record<
	string,
	{
		prefix: string | RegExp | null;
		type: string;
		variations:
			| {
					prefix: string;
					type: string;
			  }[]
			| null;
	}
>;

type CommentLineVariation = (typeof TOKENS.comment.variations)[number]['type'];

const PO_NODE_ID = {
	comment: 'comment',
	entry: 'entry',
	eof: 'eof',
	whitespace: 'whitespace'
} as const;

type PoBaseNode<id extends keyof typeof PO_NODE_ID, T> = {
	id: id;
	data: T;
};

type PoEntry = PoBaseNode<
	'entry',
	{
		msgid: string;
		msgstr: string[];
	}
>;

type PoComment = PoBaseNode<
	'comment',
	{
		comment: string;
		variation: CommentLineVariation;
	}
>;

type PoWhitespace = PoBaseNode<'whitespace', null>;

type PoEOF = PoBaseNode<'eof', null>;

export type PoNode = PoEntry | PoComment | PoEOF | PoWhitespace;

function consumeLine(arrReference: string[]): string | undefined {
	LINE_INDEX++;

	const line = arrReference.shift();

	return line;
}

export function parsePoContent(content: string, filePath: string) {
	FILE_PATH = filePath;
	const lines = content.split('\n');

	const headerIterator = new PoHeaderLineParserIterator(lines);
	const bodyIterator = new PoBodyLineParserIterator(lines);

	return {
		header: headerIterator,
		body: bodyIterator
	};
}

const listFormat = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });

export class PoBodyLineParserIterator implements Iterator<PoNode> {
	constructor(private lines: string[]) {}

	next(): IteratorResult<PoNode> {
		const line = consumeLine(this.lines);
		if (line === undefined) {
			return { value: { id: 'eof', data: null }, done: true };
		}
		return { value: parsePoBodyLine(line.trim(), this.lines), done: false };
	}
}

const whitespaceRegex = new RegExp('^\\s*$');

function parsePoBodyLine(line: string, arrReference: string[]): PoNode {
	if (line.match(whitespaceRegex)) {
		return {
			id: PO_NODE_ID.whitespace,
			data: null
		};
	}

	if (line.charAt(0) === TOKENS.comment.prefix) {
		const commentVariationChar = line.charAt(1);
		const comment = getCommentContent(line);

		const found = TOKENS.comment.variations.find(
			(variation) => variation.prefix === commentVariationChar
		);

		if (!found) {
			const variations = TOKENS.comment.variations?.map((variation) => variation.prefix) ?? [];
			throw new PoParseError(`Invalid comment variation: ${commentVariationChar}`, {
				cause: line,
				expected: `one of ${listFormat.format(variations)}`,
				actual: commentVariationChar
			});
		}

		return {
			id: PO_NODE_ID.comment,
			data: {
				comment,
				variation: found.type
			}
		};
	}

	if (line.startsWith(TOKENS.msgid.prefix)) {
		const nextLine = consumeLine(arrReference);

		if (nextLine === undefined) {
			return {
				id: PO_NODE_ID.eof,
				data: null
			};
		}

		if (!nextLine.startsWith(TOKENS.msgstr.prefix)) {
			throw new PoParseError(`Line after msgid should start with msgstr`, {
				cause: line + '\n' + nextLine,
				expected: `something starting with ${TOKENS.msgstr.prefix} after msgid`,
				actual: nextLine
			});
		}

		const msgid = getMsgidContent(line);
		const msgstr = getMsgstrContent(nextLine);

		return {
			id: PO_NODE_ID.entry,
			data: {
				msgid,
				msgstr: [msgstr]
			}
		};
	}

	const tokens = Object.values(TOKENS)
		.map((token) => token.prefix)
		.filter((prefix) => prefix !== null);

	throw new PoParseError(`Invalid line: ${line}`, {
		cause: line,
		expected: `one of ${listFormat.format(tokens)}`,
		actual: line
	});
}

type PoHeader = {
	msgid: string;
	msgstr: string;
	projectIdVersion: string;
	reportMsgidBugsTo: string;
	potCreationDate: string;
	poRevisionDate: string;
	lastTranslator: string;
	languageTeam: string;
	language: string;
	mimeVersion: string;
	contentType: string;
	contentTransferEncoding: string;
	pluralForms: {
		nplurals: number;
		plural: (n: number) => boolean;
	};
};

type PoHeaderKey = keyof PoHeader;

const PO_HEADER_KEYS = {
	'Project-Id-Version': 'projectIdVersion',
	'Report-Msgid-Bugs-To': 'reportMsgidBugsTo',
	'POT-Creation-Date': 'potCreationDate',
	'PO-Revision-Date': 'poRevisionDate',
	'Last-Translator': 'lastTranslator',
	'Language-Team': 'languageTeam',
	Language: 'language',
	'MIME-Version': 'mimeVersion',
	'Content-Type': 'contentType',
	'Content-Transfer-Encoding': 'contentTransferEncoding',
	'Plural-Forms': 'pluralForms',
	msgid: 'msgid',
	msgstr: 'msgstr'
} as const satisfies Record<string, PoHeaderKey>;

type PoHeaderNode = {
	id: PoHeaderKey;
	data: PoHeader[PoHeaderKey];
};

function removeQuotes(str: string): string {
	return str.replace(/^"|"$/g, '');
}

function getMsgidContent(line: string): string {
	const msgid = line.slice(TOKENS.msgid.prefix.length + 1);
	return removeQuotes(msgid);
}

function getMsgstrContent(line: string): string {
	const msgstr = line.slice(TOKENS.msgstr.prefix.length + 1);
	return removeQuotes(msgstr);
}

function getCommentContent(line: string): string {
	const comment = line.slice(TOKENS.comment.prefix.length + 1);
	return comment;
}

export class PoHeaderLineParserIterator implements Iterator<PoHeaderNode> {
	constructor(private lines: string[]) {}

	next(): IteratorResult<PoHeaderNode> {
		const line = consumeLine(this.lines);

		const extremes = {
			start: `"`,
			end: `\\n"`
		};

		if (line === undefined) {
			return { value: { id: 'eof', data: null }, done: true };
		}

		const isHeaderLine = line.startsWith(extremes.start) && line.endsWith(extremes.end);

		if (!isHeaderLine) {
			return { value: undefined, done: true };
		}

		const content = line.slice(extremes.start.length, -extremes.end.length);

		const dividerIndex = content.indexOf(':');
		const key = content.slice(0, dividerIndex).trim();
		const value = content.slice(dividerIndex + 1).trim();

		return { value: parseHeaderKeyValue(key, value), done: false };
	}
}

function parseHeaderKeyValue(key: string, value: string): PoHeaderNode {
	if (key === 'Plural-Forms') {
		return {
			id: 'pluralForms',
			data: parsePluralForms(value)
		};
	}

	if (key in PO_HEADER_KEYS) {
		return {
			id: PO_HEADER_KEYS[key as keyof typeof PO_HEADER_KEYS],
			data: value
		};
	}

	throw new PoParseError('Invalid header line key', {
		cause: key,
		expected: `one of ${listFormat.format(Object.keys(PO_HEADER_KEYS))}`,
		actual: key
	});
}

function parsePluralForms(value: string): {
	nplurals: number;
	plural: (n: number) => boolean;
} {
	// nplurals=?; plural=(n ? ?);
	const regex = /nplurals=(\d+); plural=\(n\s*([!=<>]+)\s*(\d+)\);/;
	const match = value.match(regex);
	if (match === null) {
		throw new PoParseError('Invalid plural forms value', {
			cause: value,
			expected: 'a valid plural forms value',
			actual: value
		});
	}

	const nPlurals = Number(match[1]);

	if (isNaN(nPlurals)) {
		throw new PoParseError('Invalid nplurals value', {
			cause: value,
			expected: 'a number',
			actual: nPlurals.toString()
		});
	}

	const op = match[2];
	const opNumber = Number(match[3]);

	const opFns = {
		'!=': (n: number) => n !== opNumber,
		'==': (n: number) => n === opNumber,
		'<': (n: number) => n < opNumber,
		'<=': (n: number) => n <= opNumber,
		'>': (n: number) => n > opNumber
	};

	if (!opFns[op as keyof typeof opFns]) {
		throw new PoParseError('Invalid plural forms operator', {
			cause: value,
			expected: `one of ${listFormat.format(Object.keys(opFns))}`,
			actual: op ?? 'undefined'
		});
	}

	return {
		nplurals: nPlurals,
		plural: (n: number) => opFns[op as keyof typeof opFns](n)
	};
}
