/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import { Observable } from 'rxjs';
import {
  MimeType_,
  URL_,
  createDataset,
  createDatasets,
  Dataset
} from './datasets';
import { Converter } from './converters';
import { CachedObservable } from './cachedObservable';

export const INVALID = Symbol('INVALID');

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
export class MimeTypeDataType<T> extends DataType<MimeType_, T> {
  parseMimeType(mimeType: MimeType_): MimeType_ | typeof INVALID {
    return mimeType;
  }
  createMimeType(typeData: MimeType_): MimeType_ {
    return typeData;
  }
}

export abstract class TypedURL<T> {
  abstract parse(url: URL_): T | null | undefined;

  abstract create(args: T): URL_;
}

export class DefaultTypedURL extends TypedURL<URL> {
  parse(url: URL_) {
    return new URL(url);
  }

  create(url: URL) {
    return url.toString();
  }
}

/**
 * Create a a new converter, assuming:
 *
 * * returns either a single value or nothing
 * * Cost is one more than the input
 * * if it returns an observable, we should cache this observable
 */
export function createConverter<
  fromD,
  toD,
  fromT = MimeType_,
  toT = MimeType_,
  urlT = URL
>(
  {
    from = new MimeTypeDataType<fromD>() as any,
    to = new MimeTypeDataType<toD>() as any,
    url: urlT = new DefaultTypedURL() as any
  }: {
    from?: DataType<fromT, fromD>;
    to?: DataType<toT, toD>;
    url?: TypedURL<urlT>;
  },
  fn: (_: {
    data: fromD;
    url: urlT;
    type: fromT;
  }) =>
    | null
    | undefined
    | (toT extends void ? toD : never)
    | { data: toD; type: toT }
    | Array<{ data: toD; type: toT }>
): Converter<fromD, toD> {
  return ({ url, mimeType, cost, data }) => {
    const type = from.parseMimeType(mimeType);
    if (type === INVALID) {
      return [];
    }
    const urlArgs = urlT.parse(url);
    if (urlArgs === null || urlArgs == undefined) {
      return [];
    }
    const res = fn({ url: urlArgs, data, type });
    if (!res) {
      return [];
    }
    const arrayRes = isTypeData(res)
      ? [res]
      : Array.isArray(res)
      ? res
      : [{ type: (undefined as any) as toT, data: res }];
    return arrayRes.map(({ data: newData, type: newType }) => ({
      data:
        newData instanceof Observable
          ? ((CachedObservable.from(newData) as any) as toD)
          : newData,
      mimeType: to.createMimeType(newType),
      cost: cost + 1
    }));
  };
}

export function isTypeData(o: unknown): o is { data: unknown; type: unknown } {
  return o instanceof Object && 'data' in o && 'type' in o;
}
