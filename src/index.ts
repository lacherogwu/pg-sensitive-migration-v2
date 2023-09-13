import { readLargeFile, createWriteStream } from './file';

const dbDumpPath = './dump/dump.sql';

const writeStream = createWriteStream('./dump/dump.copy.sql');

let count = 0;
let headers: string[] = [];
for await (let line of readLargeFile(dbDumpPath)) {
	if (line.startsWith('COPY')) {
		const match = line.match(/\((.+)\)/);
		if (!match) throw new Error('headers not found');
		headers = match[1].split(', ');
		count++;
	} else if (line === '\\.\n') {
		headers = [];
	} else if (headers.length) {
		const lineObj = parseLine(line);
		const mappedLineObj = map(lineObj);
		line = unparseLine(mappedLineObj);
	}

	await writeStream.write(line + '\n');
}
writeStream.end();

function map(item: Record<string, any>) {
	return Object.fromEntries(Object.entries(item).map(([key, value]) => [key, value + '-EDITED']));
}

function parseLine(line: string) {
	const values = line.split('\t');
	const lineObj = headers.reduce((acc, header, i) => {
		acc[header] = values[i];
		return acc;
	}, {} as Record<string, any>);

	return lineObj;
}

function unparseLine(lineObj: any) {
	const values = headers.map(header => {
		return lineObj[header];
	});
	return values.join('\t');
}
