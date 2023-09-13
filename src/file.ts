import fs from 'fs';

export async function* readLargeFile(path: string) {
	const readStream = fs.createReadStream(path, { flags: 'r' });
	let previous = '';
	for await (const chunk of readStream) {
		previous += chunk;
		let eolIndex;
		while ((eolIndex = previous.indexOf('\n')) >= 0) {
			const line = previous.slice(0, eolIndex);
			yield line;
			previous = previous.slice(eolIndex + 1);
		}
	}

	readStream.close();
}

export function createWriteStream(path: string) {
	const writeStream = fs.createWriteStream(path, { flags: 'w' });

	return {
		async write(data: any) {
			const overWatermark = writeStream.write(data);
			if (!overWatermark) {
				await new Promise(r => writeStream.once('drain', r));
			}
		},
		end() {
			writeStream.end();
		},
	};
}
