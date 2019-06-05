import { Registry, Converter } from "./index";
import { resolveDataType } from "./resolvers";

import { create } from "rxjs-spy";
import { getURLs, getMimeTypes, getData } from "./datasets";

const spy = create();
spy.log("");

test("Creating resolve dataset", () => {
  const url = "http://some-url.com/";
  const datasets = resolveDataType.createDatasets(url);

  //  Verify that URL is
  expect(getURLs(datasets)).toEqual(new Set([url]));
  const expectedMimeType = resolveDataType.createMimeType();
  // Verify that mimetype is resolve mimetype
  expect(getMimeTypes(datasets, url)).toEqual(new Set([expectedMimeType]));

  // Verify that data is null
  expect(getData(datasets, url, expectedMimeType)).toBeFalsy();
});

test("Adding dataset URL registers it", () => {
  const r = new Registry();
  const url = "http://some-url.com/";
  const mimeType = "some-mimetype";
  const data = "data";

  r.addDataset(url, mimeType, data);
  const dataset = r.getURL(url);

  expect(new Set(dataset.keys())).toEqual(
    new Set([resolveDataType.createMimeType(), mimeType])
  );

  expect(dataset.get(mimeType)![1]).toEqual(data);
});

test("Adding a converter gives the new mimetype", () => {
  const url = "some-url";
  const initialMimeType = "initial";
  const convertedMimeType = "converted";
  const initialData = "initial-data";
  const convertedData = "some-url/initial-data";
  const dataConverter = jest.fn(
    (url: string, data: string) => `${url}/${data}`
  );

  const r = new Registry();

  r.addDataset(url, initialMimeType, initialData);

  const converter: Converter<string, string> = (mimeType, url) =>
    mimeType === initialMimeType
      ? new Map([[convertedMimeType, data => dataConverter(url, data)]])
      : new Map();

  r.addConverter(converter);

  expect(dataConverter.mock.calls.length).toBe(0);
  const dataset = r.getURL(url);

  expect(new Set(dataset.keys())).toEqual(
    new Set([
      resolveDataType.createMimeType(),
      initialMimeType,
      convertedMimeType
    ])
  );

  expect(dataset.get(initialMimeType)![1]).toEqual(initialData);
  expect(dataset.get(convertedMimeType)![1]).toEqual(convertedData);
  expect(dataConverter.mock.calls.length).toBe(1);

  // Grabbing data again shouldn't call again
  expect(r.getURL(url).get(convertedMimeType)![1]).toEqual(convertedData);
  expect(dataConverter.mock.calls.length).toBe(1);
});
