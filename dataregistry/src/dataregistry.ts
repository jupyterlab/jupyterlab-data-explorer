import { Token } from '@phosphor/coreutils';
import { IDisposable } from '@phosphor/disposable';
import { IConverterRegistry, MimeType_ } from './converters';
import { Dataset, IDatasetRegistry } from './datasets';
import { resolveDataSet, resolveDataType } from './resolvers';
import { viewerDataType } from './viewers';
import { INVALID } from './datatype';

export interface IDataRegistryConfig {
  converters: IConverterRegistry;
  data: IDatasetRegistry;
}

/**
 * Registry that composes converter and dataset registry
 * in order to implement logic that requires both of them.
 */
export class DataRegistry {
  public readonly converters: IConverterRegistry;
  public readonly data: IDatasetRegistry;
  constructor(config: IDataRegistryConfig) {
    this.converters = config.converters;
    this.data = config.data;
  }

  registerURL_(url: URL_): IDisposable | null {
    const dataset = resolveDataSet(url);
    if (this.data.contains(dataset)) {
      return null;
    }
    return this.data.publish(dataset);
  }

  /**
   * Returns whether a URL_, if registered, will have any conversions.
   *
   * Basically checks if the we will be able to resolve the mimetype just from the URL_.
   */
  hasConversions(url: URL_): boolean {
    return (
      this.converters.listTargetMimeTypes(url, [resolveDataType.mimeType])
        .size > 1
    );
  }

  /**
   * Returns all mimetypes a URL_ that is already registered
   * can be converted to.
   */
  possibleMimeTypesForURL_(url: URL_): Set<string> {
    return this.converters.listTargetMimeTypes(
      url,
      this.data.mimeTypesForURL_(url)
    );
  }
  /**
   * Returns the viewer labels for a given URL_.
   */
  viewersForURL_(url: URL_): Set<string> {
    const res = new Set<string>();
    for (const mimeType of this.possibleMimeTypesForURL_(url)) {
      const label = viewerDataType.parseMimeType(mimeType);
      if (label !== INVALID) {
        res.add(label);
      }
    }
    return res;
  }

  /**
   * View a dataset with a certain URL_ with the viewer with a certain label.
   */
  async viewURL_(url: URL_, label: string): Promise<void> {
    const viewer: Dataset<() => Promise<void>> = await this.convertByURL_(
      url,
      viewerDataType.createMimeType(label)
    );
    await viewer.data();
  }

  /**
   * Returns a dataset of the the target mime type converted from existing
   * data types with the same URL_.
   *
   * Any datasets that are created will be added to the registery.
   */
  async convertByURL_(
    url: URL_,
    targetMimeType: MimeType_
  ): Promise<Dataset<any>> {
    let finalDataSet: Dataset<any>;
    for await (const dataset of this.converters.convert(
      this.data.filterByURL_(url),
      targetMimeType
    )) {
      finalDataSet = dataset;
      if (!this.data.contains(dataset)) {
        this.data.publish(dataset);
      }
    }
    return finalDataSet!;
  }
}

export interface IDataRegistry extends DataRegistry {}
export const IDataRegistry = new Token<IDataRegistry>(
  '@jupyterlab/dataregistry:IDataRegistry'
);
