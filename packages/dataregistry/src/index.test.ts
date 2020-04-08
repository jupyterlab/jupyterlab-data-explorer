/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import { Registry, Converter } from './index';
import { resolveDataType } from './resolvers';

import { create } from 'rxjs-spy';
import { getURLs, getMimeTypes, getData, createDatasets } from './datasets';

const spy = create();
spy.log('');

test('Creating resolve dataset', () => {
  const url = 'http://some-url.com/';
  const datasets = resolveDataType.createDatasets(url);

  //  Verify that URL is
  expect(getURLs(datasets)).toEqual(new Set([url]));
  const expectedMimeType = resolveDataType.createMimeType();
  // Verify that mimetype is resolve mimetype
  expect(getMimeTypes(datasets, url)).toEqual(new Set([expectedMimeType]));

  // Verify that data is null
  expect(getData(datasets, url, expectedMimeType)).toBeFalsy();
});

test('Adding dataset URL registers it', () => {
  const r = new Registry();
  const url = 'http://some-url.com/';
  const mimeType = 'some-mimetype';
  const data = 'data';

  r.addDatasets(createDatasets(url, mimeType, data));
  const dataset = r.getURL(url);

  expect(new Set(dataset.keys())).toEqual(
    new Set([resolveDataType.createMimeType(), mimeType])
  );

  expect(dataset.get(mimeType)![1]).toEqual(data);
});

test('Adding a converter gives the new mimetype', () => {
  const url = 'some-url';
  const initialMimeType = 'initial';
  const convertedMimeType = 'converted';
  const initialData = 'initial-data';
  const convertedData = 'some-url/initial-data';
  const dataConverter = jest.fn(
    (url: string, data: string) => `${url}/${data}`
  );

  const r = new Registry();

  r.addDatasets(createDatasets(url, initialMimeType, initialData));

  const converter: Converter<string, string> = ({
    mimeType,
    url,
    data,
    cost,
  }) =>
    mimeType === initialMimeType
      ? [{ mimeType: convertedMimeType, data: dataConverter(url, data), cost }]
      : [];

  r.addConverter(converter);

  expect(dataConverter.mock.calls.length).toBe(0);
  const dataset = r.getURL(url);

  expect(new Set(dataset.keys())).toEqual(
    new Set([
      resolveDataType.createMimeType(),
      initialMimeType,
      convertedMimeType,
    ])
  );

  expect(dataset.get(initialMimeType)![1]).toEqual(initialData);
  expect(dataset.get(convertedMimeType)![1]).toEqual(convertedData);
  expect(dataConverter.mock.calls.length).toBe(1);

  // Grabbing data again shouldn't call again
  expect(r.getURL(url).get(convertedMimeType)![1]).toEqual(convertedData);
  expect(dataConverter.mock.calls.length).toBe(1);
});
