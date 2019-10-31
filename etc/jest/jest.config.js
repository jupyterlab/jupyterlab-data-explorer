/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

const resolve = require('path').resolve;
const { defaults: tsjPreset } = require('ts-jest/presets');

// Resolve the root project directory:
const ROOT = resolve(__dirname, '..', '..');

const config = {
  rootDir: ROOT,

  // Needed for jest-screenshots
  testRunner: 'jest-circus/runner',

  testEnvironment: resolve(__dirname, 'jest-environment.js'),
  globalSetup: 'jest-environment-puppeteer/setup',
  globalTeardown: 'jest-environment-puppeteer/teardown',
  setupFilesAfterEnv: ['expect-puppeteer'],
  transform: {
    ...tsjPreset.transform
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/test/**/test*.ts?(x)'],
  testPathIgnorePatterns: ['/build/', '/lib/', '/node_modules/'],
  globals: {
    'ts-jest': {
      tsConfig: resolve(ROOT, 'tsconfig.test.json')
    }
  }
};

/**
 * Exports.
 */
module.exports = config;
