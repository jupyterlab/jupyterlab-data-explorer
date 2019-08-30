import * as uriTemplates from "uri-templates";

import { URL_ } from "./datasets";

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
 * Type safe URL / URI Templates from RFC 6570
 * 
 * ```
 * new URLTemplate('http://www.example.com/foo{?query,number}', {query: URLTemplate.string, number: URLTemplate.number})
 * ```
 */

export class URLTemplate<T extends { [arg: string]: any }> extends TypedURL<T> {
  /**
   * Pass in the URL template as well an optional filter parameter that is called
   * when parsing to further validate the args.
   */
  constructor(
    private readonly template: string,
    private readonly map: StringMapping<T>
  ) {
    super();
    this._template = uriTemplates(template);
  }

  // These are some common types:

  static get string(): Adjunction<string, string> {
    return [s => s, s => s];
  }

  static get number(): Adjunction<string, number> {
    return [
      s => {
        const n = Number(s);
        return isNaN(n) ? null : n;
      },
      s => s.toString()
    ];
  }

  static extension(extension: string): Adjunction<string, string> {
    return [s => (s.endsWith(extension) ? s : null), s => s];
  }

  parse(url: URL_): T | null | undefined {
    const args = (this._template.fromUri(url) as any) as
      | {
          [k in keyof T]: string;
        }
      | undefined;
    if (!args) {
      return null;
    }
    const newObject = Object.fromEntries(
      Object.entries(args).map(([key, val]) => [key, this.map[key][0](val)])
    );
    // If none  of the value were none, return the object
    if (nonNullableValues(newObject)) {
      return newObject;
    }
  }

  create(args: T): URL_ {
    return this._template.fill(
      Object.fromEntries(
        Object.entries(args).map(([key, val]) => [key, this.map[key][1](val)])
      )
    );
  }

  /**
   * Extends a URL template by adding another template on to the end.
   */
  extend<U extends { [arg: string]: any }>(
    template: string,
    map: StringMapping<U>
  ): URLTemplate<T & U> {
    return new URLTemplate(this.template + template, {
      ...this.map,
      ...map
    } as any);
  }

  private readonly _template: uriTemplates.URITemplate;
}

/**
 * Checks if an object has all non nullable values.
 */
function nonNullableValues<T extends { [k: string]: any }>(
  t: T
): t is { [K in keyof T]: NonNullable<T[K]> } {
  return !Object.values(t).some(v => v === null || v === undefined);
}

/**
 * Sort of like an Adjunction https://en.wikipedia.org/wiki/Adjoint_functors
 * in that  you specify two functions, which  should be the inverse.
 *
 * However, it's a bit different since the first one is partial.
 */
export type Adjunction<T, V> = [
  (args: T) => V | null | undefined,
  (args: V) => T
];

type StringMapping<T extends { [key: string]: any }> = {
  [K in keyof T]: Adjunction<string, T[K]>;
};
