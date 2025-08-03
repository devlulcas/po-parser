const valueForMSGIDWithPluralList = {
	'No plural': {},
	'Time: {s:number} second': {
		[1]: 'Time: {s:number} seconds'
	},
	'Decryption of this file failed:': {
		[1]: 'Decryption of these files failed:',
		[2]: 'Decryption of these {n:number} files failed:'
	},
	'I like my fruit': {
		[1]: 'I like my {n:number} apples',
		[2]: 'I like my {n:number} apples and {x:number} oranges'
	}
} as const;

type MSGIDWithPluralList = typeof valueForMSGIDWithPluralList;

type MSGIDStatic = keyof MSGIDWithPluralList;

type PluralForm = 0 | 1;

const getPluralForm = (n: number): PluralForm => {
	return n === 1 ? 0 : 1;
};

type TProps<
	S extends MSGIDStatic,
	R extends DynamicFragment<S>
> = GetAllFormsForMSGID<S>[] extends S[]
	? { plural?: never; replace: R }
	:
			| { plural?: { count: number } | { form: PluralForm }; replace?: R }
			| { plural: { use: R extends { [key: string]: number } ? keyof R : never }; replace: R };

type StringToType<T extends string> = T extends 'number' ? number : string;

// X : { 1: Y, 2: Z } -> X | Y | Z
type GetAllFormsForMSGID<T extends string> = T extends MSGIDStatic
	? T | MSGIDWithPluralList[T][keyof MSGIDWithPluralList[T]]
	: never;

// a b  {trem:string}  {treco:number} etc etc -> { trem:string, treco:number }
type ExtractObject<T extends string> =
	T extends `${infer _Before}{${infer Key}:${infer Type}}${infer Rest}`
		? { [K in Key]: StringToType<Type> } & ExtractObject<Rest>
		: {}; // Base case: no more matches

type DynamicFragment<T extends MSGIDStatic> = ExtractObject<GetAllFormsForMSGID<T>>;

export const typeFromString: StringToType<'number'> = 1;

export const forms: GetAllFormsForMSGID<'Decryption of this file failed:'>[] = [
	'Decryption of this file failed:',
	'Decryption of these files failed:',
	'Decryption of these {n:number} files failed:'
];

export const formsEmpty: GetAllFormsForMSGID<'No plural'>[] = ['No plural'];

export const typeFromMSGID: ExtractObject<'{s:number}'> = { s: 1 };

export const typeFromMSGIDFull: ExtractObject<'Time: {s:number} second'> = { s: 1 };

export const typeFromMSGIDFullMoreThanOne: ExtractObject<'{a:number} apples and {b:number} oranges'> =
	{
		a: 1,
		b: 2
	};

export const dynamicFragmentSimple: DynamicFragment<'Time: {s:number} second'> = {
	s: 1
};
export const dynamicFragmentPlural: DynamicFragment<'I like my fruit'> = {
	n: 1,
	x: 2
};

// regex to match {key:type}
const replaceRegex = /{(\w+):(\w+)}/g;
function t<S extends MSGIDStatic, R extends DynamicFragment<S>>(s: S, props?: TProps<S, R>) {
	if (!props) {
		return s;
	}

	let out: string = s;
	let pluralForm: PluralForm = 0;

	const asRecord: { [key: number]: string } | {} = valueForMSGIDWithPluralList[s];

	const messages = new Map(Object.entries(asRecord));

	if (messages.size && props.plural) {
		if ('count' in props.plural) {
			pluralForm = getPluralForm(props.plural.count);
		} else if ('use' in props.plural) {
			const count = props.replace?.[props.plural.use];
			pluralForm = getPluralForm(Number(count));
		} else {
			pluralForm = props.plural.form;
		}

		out = messages.get(pluralForm.toString()) ?? messages.get('1') ?? s;
	}

	if (!props.replace) {
		return out;
	}

	const matches = out.matchAll(replaceRegex);
	if (matches) {
		for (const match of matches) {
			const [full, key, _] = match;
			const value = props.replace[key as keyof R];
			if (value) {
				out = out.replace(full, value.toString());
			}
		}
	}

	return out;
}

console.log(
	t('Time: {s:number} second', {
		replace: {
			s: 1
		}
	}),
	'\n',
	t('Time: {s:number} second', {
		plural: {
			use: 's'
		},
		replace: {
			s: 1
		}
	}),
	'\n',
	t('Time: {s:number} second', {
		plural: {
			form: 0
		},
		replace: {
			s: 1
		}
	})
);

console.log(
	t('Time: {s:number} second', {
		replace: {
			s: 3
		}
	}),
	'\n',
	t('Time: {s:number} second', {
		plural: {
			use: 's'
		},
		replace: {
			s: 3
		}
	}),
	'\n',
	t('Time: {s:number} second', {
		plural: {
			form: 1
		},
		replace: {
			s: 3
		}
	})
);

console.log(
	t('No plural', {
		replace: {
			s: 3
		}
	})
);
