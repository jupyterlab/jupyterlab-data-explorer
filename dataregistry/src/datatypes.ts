/**
 * Typed datasets allow us to associate mimetypes with different types of the
 * the underlying data and parameters set in the mimetype.
 *
 * The use case is to be able to create converters in a type safe manner.
 */

import { Converter } from "./converters";
import {
  MimeType_,
  Dataset,
  URL_,
  createDatasets,
  createDataset
} from "./datasets";
import { Observable } from "rxjs";
import { CachedObservable } from "./cachedObservable";

export const INVALID = Symbol("INVALID");

/**
 * TypedConverter gives you the Converter type between two types. If either is a TypedConverter,
 * uses the inner data type. I.e:
 *
 * ```
 * TypedConverter<DataType<any, string>, DataType<any, int>< === Converter<string, int>
 * ```
 */
export type TypedConverter<T, U> = T extends DataType<any, infer V>
  ? U extends DataType<any, infer X>
    ? Converter<V, X>
    : Converter<V, U>
  : U extends DataType<any, infer X>
  ? Converter<T, X>
  : Converter<T, U>;

export abstract class DataType<T, U> {
  abstract parseMimeType(mimeType: MimeType_): T | typeof INVALID;
  abstract createMimeType(typeData: T): MimeType_;

  createDataset(data: U, typeData: T) {
    return createDataset(this.createMimeType(typeData), data);
  }
  createDatasets(url: URL_, data: U, typeData: T) {
    return createDatasets(url, this.createMimeType(typeData), data);
  }

  /**
   * Filer dataset for mimetypes of this type.
   */
  filterDataset(dataset: Dataset<any>): Map<T, U> {
    const res = new Map<T, U>();
    for (const [mimeType, [, data]] of dataset) {
      const typeData_ = this.parseMimeType(mimeType);
      if (typeData_ !== INVALID) {
        res.set(typeData_, data as any);
      }
    }
    return res;
  }
}

/**
 * Dummy mime type data type, that accepts any mimetype.
 */
class MimeTypeDataType<T> extends DataType<MimeType_, T> {
  parseMimeType(mimeType: MimeType_): MimeType_ | typeof INVALID {
    return mimeType;
  }
  createMimeType(typeData: MimeType_): MimeType_ {
    return typeData;
  }
}

/**
 * Createa a new converter, assuming:
 *
 * * returns either a single value or nothing
 * * Cost is one more than the input
 * * if it returns an observable, we should cache this observable
 */
export function createConverter<fromD, toD, fromT = MimeType_, toT = MimeType_>(
  {
    from = new MimeTypeDataType<fromD>() as any,
    to = new MimeTypeDataType<toD>() as any
  }: {
    from?: DataType<fromT, fromD>;
    to?: DataType<toT, toD>;
  },
  fn: (_: {
    data: fromD;
    url: URL;
    type: fromT;
  }) => { data: toD; type: toT } | null
): Converter<fromD, toD> {
  return ({ url, mimeType, cost, data }) => {
    const type = from.parseMimeType(mimeType);
    if (type === INVALID) {
      return [];
    }
    const res = fn({ url: new URL(url), data, type });
    if (res === null) {
      return [];
    }
    const { data: newData, type: newType } = res;
    return [
      {
        data:
          newData instanceof Observable
            ? ((new CachedObservable(newData) as any) as toD)
            : newData,
        mimeType: to.createMimeType(newType),
        cost: cost + 1
      }
    ];
  };
}

export class DataTypeNoArgs<T> extends DataType<void, T> {
  constructor(public mimeType: MimeType_) {
    super();
  }
  parseMimeType(mimeType: MimeType_): void | typeof INVALID {
    if (mimeType !== this.mimeType) {
      return INVALID;
    }
  }
  createMimeType(_typeData: void): MimeType_ {
    return this.mimeType;
  }

  getDataset(d: Dataset<any>): T {
    return this.filterDataset(d)
      .values()
      .next().value;
  }
}

/**
 * Data type with one arg in it's mimetype in form:
 * `{baseMimeType}; {parameterKey}=<parameterValue>}`
 */
export class DataTypeStringArg<T> extends DataType<string, T> {
  constructor(baseMimeType: string, parameterKey: string) {
    super();
    this._base = `${baseMimeType}; ${parameterKey}=`;
  }
  parseMimeType(mimeType: MimeType_): string | typeof INVALID {
    if (!mimeType.startsWith(this._base)) {
      return INVALID;
    }
    return mimeType.slice(this._base.length);
  }
  createMimeType(typeData: string): MimeType_ {
    return `${this._base}${typeData}`;
  }

  private _base: string;
}
