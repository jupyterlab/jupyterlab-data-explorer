/**
 * Start with files as unkown mimetype
 *
 * Then convert to known filetype, with URL_ on it.
 */
import { Converter } from "./converters";
import { URLDataType } from "./urls";
import { DataTypeStringArg } from "./datatypes";
import { resolveMimetypeDataType } from "./resolvers";
import { of, from } from "rxjs";
import { URL_ } from "./datasets";
import { switchMap } from "rxjs/operators";

export type FilePath = string;
export const fileDataType = new DataTypeStringArg<FilePath>(
  "application/x.jupyter.file",
  "mimeType"
);
export function createFileURL_(path: string): URL_ {
  const url = new URL("file:");
  url.pathname = path;
  return url.toString();
}

/**
 * Creates a converter from a resolver mimetype to a file mimetype.
 */
export const resolveFileConverter = resolveMimetypeDataType.createSingleTypedConverter(
  fileDataType,
  (innerMimeType, url_) => {
    const url = new URL(url_);
    if (url.protocol !== "file:") {
      return null;
    }
    return [innerMimeType, [1, () => of(url.pathname)]];
  }
);

/**
 * Creates a converter from file paths to their download URL_s
 */
export function fileConverter(
  getDownloadURL: (path: FilePath) => Promise<URL_>
): Converter<FilePath, URL_ | string> {
  return fileDataType.createSingleTypedConverter(URLDataType, mimeType => [
    mimeType,
    [1, switchMap((path) => from(getDownloadURL(path)))]
  ]);
}

