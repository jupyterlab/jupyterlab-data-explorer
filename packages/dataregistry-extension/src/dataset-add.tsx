import React from 'react';

export const DatasetAddComponent = (options: DatasetAdd.IOptions) => {
  return (
    <button
      onClick={(e) => {
        options.onClick(e);
      }}
    >
      Add Data
    </button>
  );
};

namespace DatasetAdd {
  export interface IOptions {
    onClick: Function;
  }
}
