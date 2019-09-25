/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import { resolveExtensionConverter } from "@jupyterlab/dataregistry";
import { mimetypes } from "./../mimetypes";

/**
 * Returns a converter for converting from a resolver MIME type to a file MIME type.
 *
 * @private
 * @returns data type converter
 */
function extension2mimetype() {
  return resolveExtensionConverter(".csv", mimetypes.csv);
}

/**
 * Exports
 */
export { extension2mimetype };
export default extension2mimetype;