/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import * as uriTemplates from 'uri-templates';

import { URL_ } from './datasets';
import { TypedURL } from './createConverter';

/**
 * https://stackoverflow.com/a/6640851/907060
 */
const UUID_TEST = /^\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b$/;

/**
 * Type safe URL / URI Templates from RFC 6570
 *
 * ```
 * new URLTemplate('http://www.example.com/foo{?query,number}', {query: URLTemplate.string, number: URLTemplate.number})
 * ```
 */
export class URLTemplate<T extends { [arg: string]: any }> extends TypedURL<T> {
  /**
   * Creates a URL template, based on a string of a URL  template and a mapping of
   * variable names to pairs of inverse functions (adjunctions) which handle mapping to/from
   * that variable and a string.
   *
   * You can  use these to also filter variables, by returning null from these functions. We provide
   * a couple of common adjuncions on this class, like `string` and `number`.
   */
  constructor(
    private readonly template: string,
    private readonly map: StringMapping<T>
  ) {
    super();
    this._template = uriTemplates(template);
  }

  /**
   * Identity isomorphism for strings.
   */
  static get string(): Dual<string, string> {
    return [s => s, s => s];
  }

  static get uuid(): Dual<string, string> {
    return [s => (UUID_TEST.test(s) ? s : null), s => s];
  }

  /**
   * Parsing strings as numbers.
   */
  static get number(): Dual<string, number> {
    return [
      s => {
        const n = Number(s);
        return isNaN(n) ? null : n;
      },
      s => s.toString()
    ];
  }

  /**
   * Verifying that a string, commonly a path, ends in a certain extension.
   */
  static extension(extension: string): Dual<string, string> {
    return [s => (s.endsWith(extension) ? s : null), s => s];
  }

  /**
   * Parses this URL using the template and specified adjunctions. Returns null or undefined if
   * the URL cannot  be parsed with this template or if any of the adjunctions return null.
   */
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

  /**
   * Create a URL give the args. It fills in the template after calling the mapping functions on each arg.
   */
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
 * Checks if an object has all non-nullable values.
 */
function nonNullableValues<T extends { [k: string]: any }>(
  t: T
): t is { [K in keyof T]: NonNullable<T[K]> } {
  return !Object.values(t).some(v => v === null || v === undefined);
}

/**
 * Two functions that are isomporphisms of each other, except the first
 * is partial. Useful for a pari of deserializing function, which can fail,
 * and a serialize one which cannot.
 */
export type Dual<T, V> = [(args: T) => V | null | undefined, (args: V) => T];

type StringMapping<T extends { [key: string]: any }> = {
  [K in keyof T]: Dual<string, T[K]>;
};
