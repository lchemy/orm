const glob = require("glob-promise"),
	path = require("path"),
	{ readFile, writeFile } = require("fs-extra"),
	{ render } = require("ejs");

async function generate() {
	const templatesDir = path.join(__dirname, "./templates"),
		srcDir = path.join(__dirname, "../../src");

	const templates = await glob("**/*.ejs", {
		cwd: templatesDir
	});

	await templates.reduce(async (prev, file) => {
		await prev;
		const outFile = file.replace(/\.ejs$/, "");
		console.log(`Generating ${ outFile }...`);

		const template = await readFile(path.join(templatesDir, file), "utf8"),
			rendered = render(template, { range, repeat, N: 8 });

		await writeFile(path.join(srcDir, outFile), rendered);
	}, Promise.resolve());

	console.log("Generated all templates!")
}

function range(start, end, step) {
	if (step == null || arguments.length < 3 || step === 0) {
		step = end > start ? 1 : -1;
	}

	if (start !== end && (end > start) !== (step > 0)) {
		return [];
	}

	return Array(Math.floor((end - start) / step) + 1).fill().map((_, i) => {
		return start + i * step;
	});
}

function repeat(start, end, step, callback) {
	callback = arguments[arguments.length - 1];

	if (step == null || typeof step === "function" || arguments.length < 3 || step === 0) {
		step = end > start ? 1 : -1;
	}

	if (start !== end && (end > start) !== (step > 0)) {
		return;
	}

	for (let i = start; step < 0 ? (i >= end) : (i <= end); i += step) {
		callback(i);
	}
}

module.exports.generate = generate;
