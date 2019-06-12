import { BehaviorSubject, from, Observable, pipe, throwError } from "rxjs";
import { fromFetch } from "rxjs/fetch";
import { distinct, shareReplay, switchMap } from "rxjs/operators";
import { URL_ } from "./datasets";
import { DataTypeStringArg } from "./datatypes";
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
export const resolverURLConverter = resolveMimetypeDataType.createSingleTypedConverter(
  URLDataType,
  (resMimeType, url_) => {
    const url = new URL(url_);
    const isHTTP = url.protocol === "http:";
    const isHTTPS = url.protocol === "https:";
    if (isHTTP || isHTTPS) {
      return [resMimeType, () => new BehaviorSubject(url.toString())];
    }
    return null;
  }
);

/**
 * Download URLs and put in their string mimetypes
 */
export const URLStringConverter = URLDataType.createSingleConverter<
  Observable<string>
>(mimeType => [
  mimeType,
  pipe(
    distinct(),
    switchMap(url => fromFetch(url)),
    switchMap(r => {
      if (r.ok) {
        return from(r.text());
      } else {
        return throwError(new Error(`Bad response ${r}`));
      }
    }),
    shareReplay({ refCount: true, bufferSize: 1 })
  )
]);
