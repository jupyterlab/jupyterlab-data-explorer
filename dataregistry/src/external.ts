/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

/**
 * External URLs are useful so that if you store a reference to a dataset, it can still be accurate
 * after the JupyterLab session has ended. For example, some URLs refer to internal UUIDs for a resource
 * that are generated when JupyterLab  starts, which are not stable accross sessions.
 *
 * If a dataset has an external url, then the internal URL of that external URL, should
 * point back to the original dataset URL.
 */

import { Observable } from "rxjs";
import { URL_ } from "./datasets";
import { DataTypeNoArgs } from "./datatypes";

/**
 * URL that is safe for outside system to store long term to identify this dataset.
 */
export const externalURLDataType = new DataTypeNoArgs<Observable<URL_>>(
  "application/x.jupyter.external-url"
);

/**
 * URL that points to the canonical internal URL for this dataset. If a dataset has an internal URL,
 * you should use that to lookup data instead of its external URL.
 */
export const internalURLDataType = new DataTypeNoArgs<Observable<URL_>>(
  "application/x.jupyter.external-url"
);
