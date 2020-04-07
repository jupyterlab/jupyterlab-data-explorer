/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import { from, Observable, throwError, of } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import { distinct, switchMap } from 'rxjs/operators';
import { URL_ } from './datasets';
import { DataTypeStringArg } from './datatypes';
import { resolveMimetypeDataType } from './resolvers';
import { createConverter } from './createConverter';

/**
 * Type where data is a HTTP URL_ pointing to the data. It should be downloaded as a string and that
 * string will end up as the nested mimeType
 */
export const URLDataType = new DataTypeStringArg<Observable<URL_>>(
  'application/x.jupyter.url',
  'mimeType'
);

/**
 * Resolve URLs with mimetypes to URL datatypes
 */
export const resolverURLConverter = createConverter(
  { from: resolveMimetypeDataType, to: URLDataType },
  ({ url, type }) => {
    const isHTTP = url.protocol === 'http:';
    const isHTTPS = url.protocol === 'https:';
    if (isHTTP || isHTTPS) {
      return { type, data: of(url.toString()) };
    }
    return null;
  }
);

// TODO: Change from text/plain to other mimetypes, if they  are valid
// text mimetypes.
export const textDataType = new DataTypeStringArg<Observable<string>>(
  'text/plain',
  'mimeType'
);

/**
 * Download URLs and put in their string mimetypes
 */
export const URLStringConverter = createConverter<
  Observable<string>,
  Observable<string>
>({ from: URLDataType, to: textDataType }, ({ type, data }) => ({
  type,
  data: data.pipe(
    distinct(),
    switchMap((url) => fromFetch(url)),
    switchMap((r) => {
      if (r.ok) {
        return from(r.text());
      } else {
        console.warn(r);
        return throwError(new Error(`Bad response ${r}`));
      }
    })
  ),
}));
