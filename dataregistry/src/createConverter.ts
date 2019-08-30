import { Observable } from "rxjs";
import { MimeType_ } from "./datasets";
import { MimeTypeDataType, DataType, INVALID } from "./datatypes";
import { Converter } from "./converters";
import { CachedObservable } from "./cachedObservable";
import { DefaultTypedURL, TypedURL } from "./urltemplates";

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
  return o instanceof Object && "data" in o && "type" in o;
}
