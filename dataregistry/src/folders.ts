import { DataTypeNoArgs, TypedConverter } from "./datatypes";
import { nestedDataType } from "./nested";

import { map, shareReplay } from "rxjs/operators";
import { resolveDataType } from "./resolvers";
import { from, Observable } from "rxjs";

/**
 * A folder is a list paths in it as strings
 */
export const folderDataType = new DataTypeNoArgs<Observable<Set<string>>>(
  "application/x.jupyter.folder"
);

/**
 * Converts from a URL that is a file and ends with a `/` to a folder mimetype,
 * by fetching the contents of the folder
 */
export function createFolderConverter(
  folderContents: (path: string) => Promise<Set<string>>
): TypedConverter<typeof resolveDataType, typeof folderDataType> {
  return resolveDataType.createSingleTypedConverter(
    folderDataType,
    (_, url) => {
      const url_ = new URL(url);
      return url_.protocol === "file:" && url_.pathname.endsWith("/")
        ? [
            ,
            () =>
              from(folderContents(url_.pathname)).pipe(
                shareReplay({ bufferSize: 1, refCount: true })
              )
          ]
        : null;
    }
  );
}

/**
 * Convert from a folder of a list of paths to a nested datasets of those urls.
 */
export const folderDatasetsConverter = folderDataType.createSingleTypedConverter(
  nestedDataType,
  (_, url) => [, map(paths => new Set([...paths].map(path => `${url}${path}`)))]
);
