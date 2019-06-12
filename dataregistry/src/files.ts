/**
 * Start with files as unknown mimetype
 *
 * Then convert to known filetype, with URL on it.
 */
import { URLDataType } from "./urls";
import { DataTypeStringArg, TypedConverter } from "./datatypes";
import { resolveMimetypeDataType } from "./resolvers";
import { from } from "rxjs";
import { URL_ } from "./datasets";
import { shareReplay } from "rxjs/operators";

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
    return [innerMimeType, () => url.pathname];
  }
);

/**
 * Creates a converter from file paths to their download URLs
 */
export function fileURLConverter(
  getDownloadURL: (path: FilePath) => Promise<URL_>
): TypedConverter<typeof fileDataType, typeof URLDataType> {
  return fileDataType.createSingleTypedConverter(URLDataType, mimeType => [
    mimeType,
    path =>
      from(getDownloadURL(path)).pipe(
        shareReplay({ refCount: true, bufferSize: 1 })
      )
  ]);
}
