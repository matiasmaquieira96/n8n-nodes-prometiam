// `node --test test/` needs this file on Node 21 and later: those versions treat the argument as a path to run (not
// a directory to scan), and a directory runs its index.js. Node 20 scans the directory and runs every file itself,
// this one included, so the suites are only imported here when this file was reached through the directory.
const path = require('node:path');

const entry = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (entry !== __filename) {
	(async () => {
		await import('./package.test.mjs');
		await import('./node.test.mjs');
		await import('./credentials.test.mjs');
		await import('./expressions.test.mjs');
	})();
}
