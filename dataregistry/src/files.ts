/**
 * Start with files as unkown mimetype
 *
 * Then convert to known filetype, with URL_ on it.
 */
import { Converter } from './converters';
import { URL_DataType } from './urls';
import { DataTypeStringArg } from './datatype';
import { resolveMimetypeDataType } from './resolvers';

export type FilePath = string;
export const fileDataType = new DataTypeStringArg<FilePath>(
  'application/x.jupyter.file',
  'mimeType'
);
export function createFileURL_(path: string): URL_ {
  const url = new URL_('file:');
  url.pathname = path;
  return url;
}

/**
 * Creates a converter from a resolver mimetype to a file mimetype.
 */
export const resolveFileConverter = resolveMimetypeDataType.createSingleTypedConverter(
  fileDataType,
  (innerMimeType, url) => {
    const path = parseFileURL_(url);
    if (path === null) {
      return null;
    }
    return [innerMimeType, async () => path];
  }
);

/**
 * Creates a converter from file paths to their download URL_s
 */
export function fileURL_Converter(
  getDownloadURL_: (path: FilePath) => Promise<URL_>
): Converter<FilePath, URL_ | string> {
  return fileDataType.createSingleTypedConverter(URL_DataType, mimeType => [
    mimeType,
    getDownloadURL_
  ]);
}

/**
 * Returns the path of a file URL_, or null if it is not one.
 * @param url
 */
function parseFileURL_(url: URL_): null | FilePath {
  if (url.protocol !== 'file:') {
    return null;
  }
  return url.pathname;
}
