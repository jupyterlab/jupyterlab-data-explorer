/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

const resolve = require('path').resolve;

const rc = resolve(__dirname, '..', 'prettier', '.prettierrc');
const ignore = resolve(__dirname, '..', 'prettier', '.prettierignore');

const config = {
  '**/*{.ts,.tsx,.js,.jsx,.css,.json,.md}': [
    'prettier --config=' + rc + ' --ignore-path=' + ignore + ' --write',
    'git add'
  ]
};

/**
 * Exports.
 */
module.exports = config;
