/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

module.exports = {
	env: {
		browser: true,
		es6: true
	},
	extends: [
		'plugin:@typescript-eslint/eslint-recommended',
		'prettier',
		'prettier/@typescript-eslint'
	],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: 'tsconfig.json',
		ecmaFeatures: {
			jsx: true
		},
		ecmaVersion: 2018,
		sourceType: 'module'
	},
	plugins: ['prettier', 'react', 'react-hooks', '@typescript-eslint'],
	rules: {
		'react-hooks/rules-of-hooks': 'error',
		'react-hooks/exhaustive-deps': 'warn',
		'prettier/prettier': ['error', { singleQuote: true }],
		indent: ['error', 2],
		'linebreak-style': ['error', 'unix'],
		'no-console': ['error', { allow: ['warn', 'error'] }]
	}
};
