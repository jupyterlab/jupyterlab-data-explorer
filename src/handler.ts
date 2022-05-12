import { URLExt } from '@jupyterlab/coreutils';

import { JSONValue } from '@lumino/coreutils';
import { ServerConnection } from '@jupyterlab/services';
import { Dataset } from './dataset';

const API_NAMEPSACE = 'dataregistry';

export class DataRegistryHandler {
  constructor(options: DataRegistryHandler.IOptions) {
    this.serverSettings =
      options.serverSettings || ServerConnection.makeSettings();
  }

  async registerDataset(dataset: Dataset<any, any>) {
    let data;
    try {
      data = await requestAPI(this.serverSettings, 'registerDataset', {
        method: 'POST',
        body: JSON.stringify(dataset)
      });
    } catch (e: any) {
      console.log(e);
    }
    return data;
  }

  async updateDataset(dataset: Dataset<any, any>) {
    let data;
    try {
      data = await requestAPI(this.serverSettings, 'updateDataset', {
        method: 'PUT',
        body: JSON.stringify(dataset)
      });
    } catch (e: any) {
      console.log(e);
    }
    return data;
  }

  async getDataset<T extends JSONValue, U extends JSONValue>(
    id: string,
    version?: string
  ): Promise<Dataset<T, U>> {
    const params = URLExt.objectToQueryString({
      id,
      version
    });

    let data;
    try {
      data = await requestAPI(this.serverSettings, `getDataset${params}`, {
        method: 'GET'
      });
    } catch (e: any) {
      console.log(e);
    }

    return data as Dataset<T, U>;
  }

  async hasDataset(id: string, version?: string) {
    const params = URLExt.objectToQueryString({
      id,
      version
    });
    try {
      await requestAPI(
        this.serverSettings,
        `hasDataset${params}`,
        {
          method: 'HEAD'
        },
        false
      );
    } catch (e: any) {
      return false;
    }
    return true;
  }

  async registerCommand(
    commandId: string,
    abstractDataType: string,
    serializationType: string,
    storageType: string
  ) {
    let data;
    try {
      data = await requestAPI(this.serverSettings, 'registerCommand', {
        method: 'POST',
        body: JSON.stringify({
          commandId,
          abstractDataType,
          serializationType,
          storageType
        })
      });
    } catch (e: any) {
      console.log(e);
    }

    return data;
  }

  async getCommands(
    abstractDataType: string,
    serializationType: string,
    storageType: string
  ) {
    const params = URLExt.objectToQueryString({
      abstractDataType,
      serializationType,
      storageType
    });

    let data;
    try {
      data = await requestAPI(this.serverSettings, `getCommands${params}`, {
        method: 'GET'
      });
    } catch (e: any) {
      console.log(e);
    }

    return data as Set<string>;
  }


  async loadCommands() {
    let data;
    try {
      data = await requestAPI(this.serverSettings, 'getCommands', {
        method: 'GET'
      });
    } catch (e: any) {
      console.log(e);
    }

    return data as {[key: string]: [string]};
  }


  async queryDataset(
    abstractDataType?: string,
    serializationType?: string,
    storageType?: string
  ) {
    let params: any = {};
    if (abstractDataType) {
      params['abstractDataType'] = abstractDataType;
    }
    if (serializationType) {
      params['serializationType'] = serializationType;
    }
    if (storageType) {
      params['storageType'] = storageType;
    }
    params = URLExt.objectToQueryString(params);

    let data;
    try {
      data = await requestAPI(this.serverSettings, `queryDataset${params}`, {
        method: 'GET'
      });
    } catch (e: any) {
      console.log(e);
    }

    return data as Promise<Dataset<any, any>[] | []>;
  }

  /**
   * The server settings used to make API requests.
   */
  readonly serverSettings: ServerConnection.ISettings;
}

/**
 * Call the API extension
 *
 * @param endPoint API REST end point for the extension
 * @param init Initial values for the request
 * @param expectData Is response data expected
 * @returns The response body interpreted as JSON
 */
async function requestAPI<T>(
  settings: ServerConnection.ISettings,
  endPoint = '',
  init: RequestInit = {},
  expectData = true
): Promise<T> {
  // Make request to Jupyter API
  const requestUrl = URLExt.join(settings.baseUrl, API_NAMEPSACE, endPoint);

  let response: Response;
  try {
    response = await ServerConnection.makeRequest(requestUrl, init, settings);
  } catch (error: any) {
    throw new ServerConnection.NetworkError(error);
  }

  let data: any = await response.text();

  if (expectData && data.length > 0) {
    try {
      data = JSON.parse(data);
    } catch (error) {
      console.log('Not a JSON response body.', response);
    }
  }

  if (!response.ok) {
    throw new ServerConnection.ResponseError(response, data.message || data);
  }

  return data;
}

export namespace DataRegistryHandler {
  /**
   * The instantiation options for a data registry handler.
   */
  export interface IOptions {
    serverSettings?: ServerConnection.ISettings;
  }
}
