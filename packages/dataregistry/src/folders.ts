/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import { DataTypeNoArgs, TypedConverter } from './datatypes';
import { nestedDataType } from './nested';

import { map } from 'rxjs/operators';
import { resolveDataType } from './resolvers';
import { Observable, defer } from 'rxjs';
import { join } from 'path';
import { createConverter } from './createConverter';
/**
 * A folder is a list paths in it as strings
 */
export const folderDataType = new DataTypeNoArgs<Observable<Set<string>>>(
  'application/x.jupyter.folder'
);

/**
 * Converts from a URL that is a file and ends with a `/` to a folder mimetype,
 * by fetching the contents of the folder
 */
export function createFolderConverter(
  folderContents: (path: string) => Promise<Set<string>>
): TypedConverter<typeof resolveDataType, typeof folderDataType> {
  return createConverter(
    { from: resolveDataType, to: folderDataType },
    ({ url }) => {
      return url.protocol === 'file:' && url.pathname.endsWith('/')
        ? defer(() => folderContents(url.pathname))
        : null;
    }
  );
}
/**
 * Convert from a folder of a list of paths to a nested datasets of those urls.
 */
export const folderDatasetsConverter = createConverter(
  { from: folderDataType, to: nestedDataType },
  ({ url, data }) =>
    data.pipe(
      map(
        (paths) =>
          new Set(
            [...paths].map((path) => {
              const u = new URL(url.toString());
              u.pathname = join(u.pathname, path);
              return u.toString();
            })
          )
      )
    )
);
