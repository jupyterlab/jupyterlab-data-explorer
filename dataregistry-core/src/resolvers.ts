import { MimeType_, URL_, Datasets$ } from "./datasets";
import { Converter, Convert } from "./converters";
import { DataTypeNoArgs, DataTypeStringArg } from "./datatypes";
import { identity, of } from "rxjs";

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
 * Plan:
 * 
 * * Add merge datasets command
 * * Have a converter from `/` path ending to folder mimetype
 * * Have a file -> folder to nested converter, that maps path to grab directory every x seconds
 * * Add nested and converted converter mimetype
 * * Registry, finish this.
 */
function createResolveDataset(...urls: Array<URL_>): Datasets$ {
  const dataset$: Dataset$ = of(
    new Map([
      [resolveDataType.createMimeType(), [0, of(url)] as [Cost, Data$]]
    ])
  );
  this.datasets.set(url, dataset$);

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
