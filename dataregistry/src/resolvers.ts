import { MimeType_, URL_, Datasets, Cost, Data$, Dataset } from "./datasets";
import { Converter, Convert } from "./converters";
import { DataTypeNoArgs, DataTypeStringArg } from "./datatypes";
import { identity, BehaviorSubject } from "rxjs";

/**
 * Datasets without a known mimetype start as just a resolve mimetype and no data.
 */
export const resolveDataType = new DataTypeNoArgs<null>(
  "application/x.jupyter.resolve"
);

/**
 * Then, their mimetype is resolved.
 */
export const resolveMimetypeDataType = new DataTypeStringArg<null>(
  "application/x.jupyter.resolve",
  "mimetype"
);

/**
 * Given some list of URLs, returns datasets that contain them.
 */
export function createResolveDataset(...urls: Array<URL_>): Datasets {
  return new Map(
    urls.map(
      url =>
        [
          url,
          new Map([
            [
              resolveDataType.createMimeType(),
              [0, new BehaviorSubject(null)] as [Cost, Data$]
            ]
          ])
        ] as [string, Dataset]
    )
  );
}

/**
 * Returns a set of possible mimetype for a URL_.
 */
export type Resolver = (url: URL_) => Set<MimeType_>;

export function resolveConverter(resolver: Resolver): Converter<null, null> {
  return resolveDataType.createTypedConverter(
    resolveMimetypeDataType,
    (_, url) => {
      const res = new Map<string, Convert<null, null>>();
      for (const mimeType of resolver(url)) {
        res.set(mimeType, [1, identity]);
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
    if (new URL(url).pathname.endsWith(extension)) {
      return new Set([mimeType]);
    }
    return new Set();
  });
}
