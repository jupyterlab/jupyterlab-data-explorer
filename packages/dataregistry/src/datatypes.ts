/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

/**
 * Typed datasets allow us to associate mimetypes with different types of the
 * the underlying data and parameters set in the mimetype.
 *
 * The use case is to be able to create converters in a type safe manner.
 *
 * TODO: could `to` be just a function instead of a paramater to createConverter?
 */

import { Converter } from './converters';
import { MimeType_, Dataset } from './datasets';
import { DataType, INVALID } from './createConverter';

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

  getDataset(d: Dataset<any>): T | undefined {
    const filtered = this.filterDataset(d);
    if (filtered.size == 0) {
      return;
    }
    return this.filterDataset(d).values().next().value;
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
