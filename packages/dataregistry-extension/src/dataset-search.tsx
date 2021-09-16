import React from 'react';

export const DatasetSearchComponent = (
  options: DatasetSearch.IOptions
): JSX.Element => {
  return (
    <div className="jp-dataset-search">
      <input type="text" placeholder="Search..." />
    </div>
  );
};

namespace DatasetSearch {
  export interface IOptions {}
}
