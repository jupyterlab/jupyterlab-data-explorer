import { DataTypeNoArgs } from "./datatypes";
import { createResolveDataset } from ".";
import { nestedDataType } from "./nested";

import { map } from "rxjs/operators";
import { resolveDataType } from "./resolvers";
import { Convert, Converter } from "./converters";
import { from } from "rxjs";
/**
 * A folder is a list paths in it as strings
 */
export const folderDataType = new DataTypeNoArgs<Array<string>>(
  "application/x.jupyter.folder"
);

/**
 * Converts from a URL that is a file and ends with a `/` to a folder mimetype,
 * by fetching the contents of the folder
 */
export function createFolderConverter(
  folderContents: (path: string) => Promise<Array<string>>
): Converter<null, Array<string>> {
  return resolveDataType.createSingleTypedConverter(
    folderDataType,
    (_, url) => {
      const url_ = new URL(url);
      return [
        undefined,
        [
          1,
          url_.protocol === "file:" && url_.pathname.endsWith("/")
            ? () => from(folderContents(url_.pathname))
            : null
        ] as Convert<null, Array<string>>
      ];
    }
  );
}

/**
 * Convert from a folder of a list of paths to a nested datasets of those urls.
 */
export const folderDatasetsConverter = folderDataType.createSingleTypedConverter(
  nestedDataType,
  (_, url) => [
    ,
    [
      1,
      map(paths => createResolveDataset(...paths.map(path => `${url}${path}`)))
    ]
  ]
);
