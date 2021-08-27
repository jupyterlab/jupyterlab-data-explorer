export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

export interface JSONObject {
  [k: string]: JSONValue;
}
export interface JSONArray extends Array<JSONValue> {}

/**
 * A type alias for a JSON type.
 */
export type JSONType = JSONValue | JSONObject | JSONArray;
