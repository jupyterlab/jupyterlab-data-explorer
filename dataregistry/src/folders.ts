import { DataTypeNoArgs, TypedConverter, createConverter } from "./datatypes";
import { nestedDataType } from "./nested";

import { map } from "rxjs/operators";
import { resolveDataType } from "./resolvers";
import { Observable, defer } from "rxjs";
import { join } from "path";
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
  return createConverter(
    { from: resolveDataType, to: folderDataType },
    ({ url }) => {
      return url.protocol === "file:" && url.pathname.endsWith("/")
        ? { data: defer(() => folderContents(url.pathname)), type: undefined }
        : null;
    }
  );
}
/**
 * Convert from a folder of a list of paths to a nested datasets of those urls.
 */
export const folderDatasetsConverter = createConverter(
  { from: folderDataType, to: nestedDataType },
  ({ url, data }) => ({
    type: undefined,
    data: data.pipe(
      map(
        paths =>
          new Set(
            [...paths].map(path => {
              const u = new URL(url.toString());
              u.pathname = join(u.pathname, path);
              return u.toString();
            })
          )
      )
    )
  })
);
