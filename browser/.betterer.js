const { eslint: eslintBetter } = require('@betterer/eslint');
const globby = import('globby');
const { resolve } = require('path');

const eslintIgnorePath = resolve(__dirname, ".eslintignore");

const eslintTypescriptIncludes = async () => (await globby).globbySync(["**/*.ts"], { ignoreFiles: eslintIgnorePath });

module.exports = {
	'avoid non-null assertions': async () =>
		eslintBetter({
			'@typescript-eslint/no-non-null-assertion': 'error',
		}).include(await eslintTypescriptIncludes()),
	'avoid expressions which have no effect': async () =>
		eslintBetter({
			'@typescript-eslint/no-unused-expressions': 'error',
		}).include(await eslintTypescriptIncludes()),
};