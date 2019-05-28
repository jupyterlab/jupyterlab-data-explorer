import { Observable, of, Subscriber, from } from "rxjs";
import {
  Datasets$,
  url,
  MimeType_,
  Data,
  Datasets,
  URL_,
  Cost,
  Dataset$,
  Data$
} from "./datasets";
import { Converter } from "./converters";
import { resolveDataType } from "./resolvers";

export class Registry {
  public readonly datasets$: Datasets$;

  private subscriber!: Subscriber<Datasets>;
  private datasets: Datasets = new Map();

  constructor() {
    this.datasets$ = new Observable(subscriber => {
      this.subscriber = subscriber;
      this.newDatasets();
    });
  }
  /**
   * Adds a new dataseset.
   *
   * If it has already been registered, throws an error.
   */
  // addDataset(url: URL_, mimeType: MimeType_, data: Observable<Data>): void {
  //   const newDatasets = new Map(this.datasets);
  //   if (newDatasets.has(url)) {

  //   } else {
  //     newDatasets.set(url, from(new Map([[mimeType, ]])))
  //   }
  // }


  /**
   * Adds a new converter.
   */
  addConverter(converter: Converter<any, any>): {

  }

  addURL(url: URL_): () => void {
    if (this.datasets.has(url)) {
      return () => this.disposeURL(url);
    }
    // Create new dataset
    this.datasets = new Map(this.datasets);
    const dataset$: Dataset$ = of(
      new Map([
        [resolveDataType.createMimeType(), [0, of(url)] as [Cost, Data$]]
      ])
    );
    this.datasets.set(url, dataset$);

    this.newDatasets();
    return () => this.disposeURL(url);
  }

  private newDatasets(): void {
    this.subscriber.next(this.datasets);
  }

  private disposeURL(url: URL_): void {
    if (!this.datasets.has(url)) {
      return;
    }
    // Create new dataset
    this.datasets = new Map(this.datasets);
    this.datasets.delete(url);
    this.newDatasets();
  }

}
