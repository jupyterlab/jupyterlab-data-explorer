/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

/**
 * Start with files as unknown mimetype
 *
 * Then convert to known filetype, with URL on it.
 */
import { URLDataType } from './urls';
import { DataTypeStringArg, TypedConverter } from './datatypes';
import { resolveMimetypeDataType } from './resolvers';
import { defer } from 'rxjs';
import { URL_ } from './datasets';
import { createConverter } from './createConverter';

export type FilePath = string;
export const fileDataType = new DataTypeStringArg<FilePath>(
  'application/x.jupyter.file',
  'mimeType'
);
export function createFileURL_(path: string): URL_ {
  const url = new URL('file:');
  url.pathname = path;
  return url.toString();
}

/**
 * Creates a converter from a resolver mimetype to a file mimetype.
 */
export const resolveFileConverter = createConverter(
  {
    from: resolveMimetypeDataType,
    to: fileDataType
  },
  ({ type, url }) => {
    if (url.protocol !== 'file:') {
      return null;
    }
    return { type, data: url.pathname };
  }
);

/**
 * Creates a converter from file paths to their download URLs
 */
export function fileURLConverter(
  getDownloadURL: (path: FilePath) => Promise<URL_>
): TypedConverter<typeof fileDataType, typeof URLDataType> {
  return createConverter(
    { from: fileDataType, to: URLDataType },
    ({ type, data }) => ({
      type,
      data: defer(() => getDownloadURL(data))
    })
  );
}
