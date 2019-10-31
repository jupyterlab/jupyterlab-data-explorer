/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

const config = {
  launch: {
    headless: process.env.HEADLESS !== 'false',
    slowMo: process.env.SLOWMO === 'true'
  },
  // https://github.com/smooth-code/jest-puppeteer/tree/master/packages/jest-dev-server#options
  server: {
    command: "jupyter lab --port 8080 --no-browser --LabApp.token=''",
    port: 8080
  }
};

/**
 * Exports.
 */
module.exports = config;
