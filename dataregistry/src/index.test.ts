import { Registry, Converter } from "./index";
import { resolveDataType } from "./resolvers";

import { create } from "rxjs-spy";
import { getURLs, getMimeTypes, getData, createDatasets } from "./datasets";
import { of, Observable } from "rxjs";
import { ToPromises } from "./testutils";
import { map } from "rxjs/operators";
import { NO_VALUE } from "./cachedObservable";

const spy = create();
spy.log("");

test("Creating resolve dataset", () => {
  const url = "http://some-url.com/";
  const datasets = resolveDataType.createDatasets(url, of(undefined));

  //  Verify URL
  expect(getURLs(datasets)).toEqual(new Set([url]));
  const expectedMimeType = resolveDataType.createMimeType();
  // Verify that mimetype is resolve mimetype
  expect(getMimeTypes(datasets, url)).toEqual(new Set([expectedMimeType]));

  // Verify that data is null
  expect(getData(datasets, url, expectedMimeType)!.state.value.value).toBe(NO_VALUE);
});

test("Adding dataset URL registers it", async () => {
  const r = new Registry();
  const url = "http://some-url.com/";
  const mimeType = "some-mimetype";
  const data = "data";

  r.addDatasets(createDatasets(url, mimeType, of(data)));
  const dataset = r.getURL(url);

  expect(new Set(dataset.keys())).toEqual(
    new Set([resolveDataType.createMimeType(), mimeType])
  );
  expect(await new ToPromises(dataset.get(mimeType)![1]).next).toEqual(data);
});

test("Adding a converter gives the new mimetype", async () => {
  const url = "some-url";
  const initialMimeType = "initial";
  const convertedMimeType = "converted";
  const initialData = "initial-data";
  const convertedData = "some-url/initial-data";
  const innerConverter = jest.fn(
    (url: string, data: string) => `${url}/${data}`
  );
  const dataConverter = (url: string, data$: Observable<string>) =>
    data$.pipe(map(data => innerConverter(url, data)));

  const r = new Registry();

  r.addDatasets(createDatasets(url, initialMimeType, of(initialData)));

  const converter: Converter<string, string> = ({
    mimeType,
    url,
    data,
    cost
  }) =>
    mimeType === initialMimeType
      ? [{ mimeType: convertedMimeType, data: dataConverter(url, data), cost }]
      : [];

  r.addConverter(converter);

  expect(innerConverter.mock.calls.length).toBe(0);
  const dataset = r.getURL(url);

  expect(new Set(dataset.keys())).toEqual(
    new Set([
      resolveDataType.createMimeType(),
      initialMimeType,
      convertedMimeType
    ])
  );

  expect(await new ToPromises(dataset.get(initialMimeType)![1]).next).toEqual(
    initialData
  );
  expect(await new ToPromises(dataset.get(convertedMimeType)![1]).next).toEqual(
    convertedData
  );
  expect(innerConverter.mock.calls.length).toBe(1);

  // Grabbing data again shouldn't call again
  expect(
    await new ToPromises(r.getURL(url).get(convertedMimeType)![1]).next
  ).toEqual(convertedData);
  expect(innerConverter.mock.calls.length).toBe(1);
});
