import { createResolveDataset, Registry, Converter, Convert } from "./index";
import { resolveDataType } from "./resolvers";
import { ToPromises } from "./testutils";

import { create } from "rxjs-spy";
import {
  getURLs,
  getMimeTypes,
  getData$,
  createDatasets,
  Datasets,
  mergeDatasets
} from "./datasets";
import { BehaviorSubject, Observable, Subscriber } from "rxjs";
import { map } from "rxjs/operators";
import { nestedDataType, convertedNestedDataType } from "./nested";

const spy = create();
spy.log("");

test("Creating resolve dataset", async () => {
  expect.assertions(3);

  const url = "http://some-url.com/";
  const datasets = createResolveDataset(url);

  //  Verify that URL is
  expect(getURLs(datasets)).toEqual(new Set([url]));
  const expectedMimeType = resolveDataType.createMimeType();
  // Verify that mimetype is resolve mimetype
  expect(getMimeTypes(datasets, url)).toEqual(new Set([expectedMimeType]));

  // Verify that data is null
  expect(
    await new ToPromises(getData$(datasets, url, expectedMimeType)!).next
  ).toBeFalsy();
});

test("Adding dataset URL registers it", async () => {
  expect.assertions(4);

  const r = new Registry();
  const ds = new ToPromises(r.datasets$);
  let datasets = await ds.next;
  expect(getURLs(datasets)).toEqual(new Set());
  const url = "http://some-url.com/";
  const mimeType = "some-mimetype";
  const data = new BehaviorSubject("data");

  r.addDatasets(createDatasets(url, mimeType, data));
  datasets = await ds.next;

  expect(getURLs(datasets)).toEqual(new Set([url]));

  expect(getMimeTypes(datasets, url)).toEqual(new Set([mimeType]));

  expect(getData$(datasets, url, mimeType)!).toEqual(data);
});

test("Adding a converter gives the new mimetype", async () => {
  expect.assertions(10);
  const url = "some-url";
  const initialMimeType = "initial";
  const convertedMimeType = "converted";
  const initialData = "initial";
  const convertedData = "some-url/initial";
  const dataConverter = jest.fn(
    (url: string, data: string) => `${url}/${data}`
  );

  const r = new Registry();

  r.addDatasets(
    createDatasets(url, initialMimeType, new BehaviorSubject(initialData))
  );

  const converter: Converter<string, string> = (mimeType, url) =>
    new Map([
      [
        convertedMimeType,
        [1, map(data => dataConverter(url, data))] as Convert<string, string>
      ]
    ]);

  r.addConverter(converter);

  const datasets = await new ToPromises(r.datasets$).next;

  expect(getURLs(datasets)).toEqual(new Set([url]));
  expect(getMimeTypes(datasets, url)).toEqual(
    new Set([initialMimeType, convertedMimeType])
  );

  const data$ = getData$(datasets, url, convertedMimeType)!;

  expect(data$).toBeTruthy();
  // Shouldn't have converted till we subscribe
  expect(dataConverter.mock.calls.length).toBe(0);

  let data = await new ToPromises(data$).next;
  expect(data).toEqual(convertedData);
  expect(dataConverter.mock.calls.length).toBe(1);

  // Grabbing data again shouldnt call again
  data = await new ToPromises(data$).next;
  expect(data).toEqual(convertedData);
  expect(dataConverter.mock.calls.length).toBe(1);

  // Grabbing datasets again shouldnt call again
  data = await new ToPromises(
    getData$(await new ToPromises(r.datasets$).next, url, convertedMimeType)!
  ).next;
  expect(data).toEqual(convertedData);
  expect(dataConverter.mock.calls.length).toBe(1);
});

test("Adding the nested converter should convert nested datasets", async () => {
  expect.assertions(16);

  const parentURL = "some-url";
  const url = "some-url-2";
  const initialMimeType = "initial";
  const convertedMimeType = "converted";
  const initialData = "initial";
  const convertedData = "some-url-2/initial";
  const dataConverter = jest.fn(
    (url: string, data: string) => `${url}/${data}`
  );

  const r = new Registry();

  let subscribe: Subscriber<Datasets>;
  const subscriber = jest.fn((subscribe_: Subscriber<Datasets>) => {
    subscribe = subscribe_;
    subscribe.next(
      createDatasets(url, initialMimeType, new BehaviorSubject(initialData))
    );
  });

  r.addDatasets(
    nestedDataType.createDatasets(parentURL, new Observable(subscriber))
  );

  const converter: Converter<string, string> = (mimeType, url) =>
    new Map([
      [
        convertedMimeType,
        [1, map(data => dataConverter(url, data))] as Convert<string, string>
      ]
    ]);

  r.addConverter(converter);

  const datasets = await new ToPromises(r.datasets$).next;
  const nestedDatasets$ = convertedNestedDataType.getData$(
    datasets,
    parentURL
  )!;

  expect(subscriber.mock.calls.length).toBe(0);
  const nestedDatasets = await new ToPromises(nestedDatasets$).next;

  expect(getData$(nestedDatasets, url, initialMimeType)).toBeTruthy();

  const nestedData$ = getData$(nestedDatasets, url, convertedMimeType)!;
  expect(nestedData$).toBeTruthy();
  expect(dataConverter.mock.calls.length).toBe(0);
  expect(await new ToPromises(nestedData$).next).toEqual(convertedData);

  expect(dataConverter.mock.calls.length).toBe(1);
  expect(subscriber.mock.calls.length).toBe(1);

  // Getting again doesn't increase calls
  expect(
    await new ToPromises(
      getData$(
        await new ToPromises(
          convertedNestedDataType.getData$(datasets, parentURL)!
        ).next,
        url,
        convertedMimeType
      )!
    ).next
  ).toEqual(convertedData);
  expect(dataConverter.mock.calls.length).toBe(1);
  expect(subscriber.mock.calls.length).toBe(1);

  // Adding new data doesnt increase calls
  r.addDatasets(createDatasets("df", "df", new BehaviorSubject("df")));
  expect(
    await new ToPromises(
      getData$(
        await new ToPromises(
          convertedNestedDataType.getData$(datasets, parentURL)!
        ).next,
        url,
        convertedMimeType
      )!
    ).next
  ).toEqual(convertedData);
  expect(dataConverter.mock.calls.length).toBe(1);
  expect(subscriber.mock.calls.length).toBe(1);

  // Adding new data to nested shouldn't increase calls
  subscribe!.next(
    mergeDatasets(
      createDatasets(url, initialMimeType, new BehaviorSubject(initialData)),
      createDatasets("sfs", "sdfsd", new BehaviorSubject("dsfs"))
    )
  );
  expect(
    await new ToPromises(
      getData$(
        await new ToPromises(
          convertedNestedDataType.getData$(datasets, parentURL)!
        ).next,
        url,
        convertedMimeType
      )!
    ).next
  ).toEqual(convertedData);
  expect(dataConverter.mock.calls.length).toBe(1);
  expect(subscriber.mock.calls.length).toBe(1);
});
