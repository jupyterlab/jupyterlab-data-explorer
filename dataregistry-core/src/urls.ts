import { DataTypeStringArg } from "./datatypes";
import { resolveMimetypeDataType } from "./resolvers";
import { URL_ } from "./datasets";
import { of, pipe } from "rxjs";
import { ajax } from "rxjs/ajax";
import { switchMap, map } from "rxjs/operators";

/**
 * Type where data is a HTTP URL_ pointing to the data.
 *
 * Note: it can either be a URL_ or a string type to accomedate loading it directly
 * from JSON as a string type.
 */
export const URLDataType = new DataTypeStringArg<URL_>(
  "application/x.jupyter.url",
  "mimeType"
);

export const resolverURLConverter = resolveMimetypeDataType.createSingleTypedConverter(
  URLDataType,
  (resMimeType, url_) => {
    const url = new URL(url_);
    const isHTTP = url.protocol === "http:";
    const isHTTPS = url.protocol === "https:";
    if (isHTTP || isHTTPS) {
      return [resMimeType, [1, () => of(url.toString())]];
    }
    return null;
  }
);

export const URL_StringConverter = URLDataType.createSingleConverter<string>(
  mimeType => [
    mimeType,
    [
      1,
      pipe(
        switchMap(ajax),
        map(r => r.responseText)
      )
    ]
  ]
);
