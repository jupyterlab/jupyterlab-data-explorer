import { MimeType_, URL_ } from "./datasets";
import { Converter, Convert } from "./converters";
import { DataTypeNoArgs, DataTypeStringArg, TypedConverter } from "./datatypes";
import { identity } from "rxjs";

/**
 * Datasets without a known mimetype start as just a resolve mimetype and no data.
 */
export const resolveDataType = new DataTypeNoArgs<void>(
  "application/x.jupyter.resolve"
);

/**
 * Then, their mimetype is resolved.
 */
export const resolveMimetypeDataType = new DataTypeStringArg<void>(
  "application/x.jupyter.resolve",
  "mimetype"
);

/**
 * Returns a set of possible mimetype for a URL_.
 */
export type Resolver = (url: URL_) => Set<MimeType_>;

export function resolveConverter(
  resolver: Resolver
): TypedConverter<typeof resolveDataType, typeof resolveMimetypeDataType> {
  return resolveDataType.createTypedConverter(
    resolveMimetypeDataType,
    (_, url) => {
      const res = new Map<string, Convert<void, void>>();
      for (const mimeType of resolver(url)) {
        res.set(mimeType, identity);
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
): Converter<void, void> {
  return resolveConverter((url: URL_) => {
    const u = new URL(url);
    if (u.pathname.endsWith(extension) && !u.hash) {
      return new Set([mimeType]);
    }
    return new Set();
  });
}
