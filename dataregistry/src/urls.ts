import { DataTypeStringArg } from './datatype';
import { resolveMimetypeDataType } from './resolvers';

/**
 * Type where data is a HTTP URL_ pointing to the data.
 *
 * Note: it can either be a URL_ or a string type to accomedate loading it directly
 * from JSON as a string type.
 */
export const URL_DataType = new DataTypeStringArg<URL_ | string>(
  'application/x.jupyter.url',
  'mimeType'
);

export const resolverURL_Converter = resolveMimetypeDataType.createSingleTypedConverter(
  URL_DataType,
  (resMimeType, url) => {
    const isHTTP = url.protocol === 'http:';
    const isHTTPS = url.protocol === 'https:';
    if (isHTTP || isHTTPS) {
      return [resMimeType, async () => url];
    }
    return null;
  }
);

async function fetchURL_(url: URL_ | string): Promise<string> {
  const response = await fetch(url.toString());
  return await response.text();
}

export const URL_StringConverter = URL_DataType.createSingleConverter<string>(
  mimeType => [mimeType, fetchURL_]
);
