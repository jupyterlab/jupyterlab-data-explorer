import React from 'react';
import { InputGroup } from '@jupyterlab/ui-components';
import { IDatasetListingModel } from './model';

export const DatasetSearchComponent = (
  options: DatasetSearch.IOptions
): JSX.Element => {
  const { model } = options;
  const handleChange = (e: React.FormEvent<HTMLElement>) => {
    const target = e.target as HTMLInputElement;
    model.filter = target.value;
  };

  return (
    <InputGroup
      type="text"
      rightIcon="ui-components:search"
      placeholder="Search..."
      onChange={handleChange}
      value={model.filter}
    />
  );
};

namespace DatasetSearch {
  export interface IOptions {
    model: IDatasetListingModel;
  }
}
