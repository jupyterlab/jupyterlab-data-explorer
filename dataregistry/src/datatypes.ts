/**
 * Typed datasets allow us to associate mimetypes with different types of the
 * the underlying data and parameters set in the mimetype.
 *
 * The use case is to be able to create converters in a type safe manner.
 */

import {
  Converter,
  Convert,
  Converts,
  SingleConvert,
  singleConverter
} from "./converters";
import {
  MimeType_,
  Dataset,
  URL_,
  createDatasets,
  createDataset
} from "./datasets";

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
  filterDataset(dataset: Dataset): Map<T, U> {
    const res = new Map<T, U>();
    for (const [mimeType, [, data]] of dataset) {
      const typeData_ = this.parseMimeType(mimeType);
      if (typeData_ !== INVALID) {
        res.set(typeData_, data as any);
      }
    }
    return res;
  }

  /**
   * Creates a converter with a source of this data type.
   *
   * Your converter functions gets passed the type data associated
   * with this data type.
   */
  createConverter<V>(
    converter: (typeData: T, url: URL_) => Converts<U, V>
  ): Converter<U, V> {
    return (mimeType: MimeType_, url: URL_) => {
      const typeData = this.parseMimeType(mimeType);
      if (typeData === INVALID) {
        return new Map();
      }
      return converter(typeData, url);
    };
  }

  createSingleConverter<V>(
    converter: (typeData: T, url: URL_) => SingleConvert<U, V>
  ): Converter<U, V> {
    return singleConverter((mimeType: MimeType_, url: URL_) => {
      const typeData = this.parseMimeType(mimeType);
      if (typeData === INVALID) {
        return null;
      }
      return converter(typeData, url);
    });
  }

  createTypedConverter<V, X>(
    dest: DataType<V, X>,
    converter: (typeData: T, url: URL_) => Map<V, Convert<U, X>>
  ): Converter<U, X> {
    return this.createConverter((typeData: T, url: URL_) => {
      const res: Converts<U, X> = new Map();
      for (const [resTypeData, convert] of converter(typeData, url)) {
        res.set(dest.createMimeType(resTypeData), convert);
      }
      return res;
    });
  }
  createSingleTypedConverter<V, X>(
    dest: DataType<V, X>,
    converter: (typeData: T, url: URL_) => null | [V, Convert<U, X>]
  ): Converter<U, X> {
    return this.createSingleConverter((typeData: T, url: URL_) => {
      const newConverter = converter(typeData, url);
      if (newConverter === null) {
        return null;
      }
      const [resTypeData, convert] = newConverter;
      return [dest.createMimeType(resTypeData), convert];
    });
  }
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

  getDataset(d: Dataset): T {
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
