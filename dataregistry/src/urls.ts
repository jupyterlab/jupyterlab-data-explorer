import { from, Observable, throwError, of } from "rxjs";
import { fromFetch } from "rxjs/fetch";
import { distinct, switchMap } from "rxjs/operators";
import { URL_ } from "./datasets";
import { DataTypeStringArg, createConverter } from "./datatypes";
import { resolveMimetypeDataType } from "./resolvers";

/**
 * Type where data is a HTTP URL_ pointing to the data. It should be downloaded as a string and that
 * string will end up as the nested mimeType
 */
export const URLDataType = new DataTypeStringArg<Observable<URL_>>(
  "application/x.jupyter.url",
  "mimeType"
);

/**
 * Resolve URLs with mimetypes to URL datatypes
 */
export const resolverURLConverter = createConverter(
  { from: resolveMimetypeDataType, to: URLDataType },
  ({ url, type }) => {
    const isHTTP = url.protocol === "http:";
    const isHTTPS = url.protocol === "https:";
    if (isHTTP || isHTTPS) {
      return { type, data: of(url.toString()) };
    }
    return null;
  }
);
/**
 * Download URLs and put in their string mimetypes
 */
export const URLStringConverter = createConverter<
  Observable<string>,
  Observable<string>
>({ from: URLDataType }, ({ type, data }) => ({
  type,
  data: data.pipe(
    distinct(),
    switchMap(url => fromFetch(url)),
    switchMap(r => {
      if (r.ok) {
        return from(r.text());
      } else {
        console.warn(r);
        return throwError(new Error(`Bad response ${r}`));
      }
    })
  )
}));
