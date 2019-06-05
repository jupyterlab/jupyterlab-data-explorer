import { DataTypeStringArg } from "./datatypes";
import { resolveMimetypeDataType } from "./resolvers";
import { URL_ } from "./datasets";
import { pipe, Observable, BehaviorSubject } from "rxjs";
import { ajax } from "rxjs/ajax";
import { switchMap, map, distinct, shareReplay } from "rxjs/operators";

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
    switchMap(ajax),
    map(r => r.responseText),
    shareReplay({ refCount: true, bufferSize: 1 })
  )
]);
