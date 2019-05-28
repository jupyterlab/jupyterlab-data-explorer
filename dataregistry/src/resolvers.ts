import { Dataset } from './datasets';
import { Converter, MimeType_ } from './converters';
import { DataTypeNoArgs, DataTypeStringArg } from './datatype';

export const resolveDataType = new DataTypeNoArgs<null>(
  'application/x.jupyter.resolve'
);
export const resolveMimetypeDataType = new DataTypeStringArg<null>(
  'application/x.jupyter.resolve',
  'mimetype'
);

export function resolveDataSet(url: URL_): Dataset<null> {
  return new Dataset(resolveDataType.createMimeType(), url, null);
}

/**
 * Returns a set of possible mimetype for a URL_.
 */
export type Resolver = (url: URL_) => Set<MimeType_>;

export function resolveConverter<T>(resolver: Resolver): Converter<null, null> {
  return resolveDataType.createTypedConverter(
    resolveMimetypeDataType,
    (_, url) => {
      const res = new Map<MimeType_, (data: null) => Promise<null>>();
      for (const mimeType of resolver(url)) {
        res.set(mimeType, async () => null);
      }
      return res;
    }
  );
}

/**
 * Creates a converter from a resolver mimetype to a file mimetype.
 */
export function resolveExtensionConverter(
  extension: string,
  mimeType: string
): Converter<null, null> {
  return resolveConverter((url: URL_) => {
    if (url.pathname.endsWith(extension)) {
      return new Set([mimeType]);
    }
    return new Set();
  });
}
