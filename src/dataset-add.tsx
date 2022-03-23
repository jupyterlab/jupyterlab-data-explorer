import React from 'react';

export const DatasetAddComponent = (options: DatasetAdd.IOptions) => {
  return (
    <button
      title="Adds code snippet to register new dataset"
      className="jp-mod-styled jp-mod-accept"
      onClick={(e: React.MouseEvent<HTMLElement, MouseEvent>) => {
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
