/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

const { setDefaultOptions } = require('expect-puppeteer');

// Extend the time allowed for tests to complete:
const timeout = 15 * 1000;
jest.setTimeout(timeout);
setDefaultOptions({ timeout });

/**
 * Returns a promise for suspending stack execution for a specified duration.
 *
 * @private
 * @param ms - duration (in milliseconds)
 * @returns promise
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('JupyterLab', () => {
  beforeAll(async () => {
    // Load JupyterLab:
    await page.goto('http://localhost:8080/lab?reset');

    // NOTE: depending on system resource constraints, this may NOT be enough time for JupyterLab to load and get "settled", so to speak. If CI tests begin inexplicably failing due to timeout failures, may want to consider increasing the sleep duration...
    await sleep(3000);
  });

  it("should show a 'Data Explorer' tab", async () => {
    expect.assertions(2);
    await expect(page).toClick('[title="Data Explorer"]');
    await expect(page).toMatchElement('.jl-explorer-heading', {
      text: 'Datasets',
      visible: true
    } as any);
  });

  it("should show a 'Data Browser' tab", async () => {
    expect.assertions(2);
    await expect(page).toClick('[title="Data Browser"]');
    await expect(page).toMatchElement('.jl-dr-browser', {
      text: 'Follow active?',
      visible: true
    } as any);
  });
});
