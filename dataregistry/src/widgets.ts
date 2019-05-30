import { MainAreaWidget } from "@jupyterlab/apputils";
import {
  Converter,
  DataTypeStringArg,
  URL_
} from "@jupyterlab/dataregistry-core";
import { Widget } from "@phosphor/widgets";
import { map } from "rxjs/operators";
import { View, viewerDataType } from "./viewers";

/**
 * A function that creates a widget for the data.
 */
export type WidgetCreator = () => Promise<Widget>;

export const widgetDataType = new DataTypeStringArg<WidgetCreator>(
  "application/x.jupyter.widget",
  "label"
);

export function extractWidgetArgs(
  widget: Widget
): {
  label: string;
  url: string;
} {
  const [label, url] = JSON.parse(widget.id);
  return { label, url };
}

export interface IHasURL_ {
  url: URL_;
}

export function hasURL_(t: any): t is IHasURL_ {
  return "url" in t;
}

class DataWidget extends MainAreaWidget implements IHasURL_ {
  constructor(content: Widget, url: URL_, label: string) {
    super({ content });
    this.id = JSON.stringify([label, url]);
    this.title.label = `${label}: ${url}`;
    this.title.closable = true;
    this.url = url;
  }
  url: URL_;
}

export type WrappedWidgetCreator = () => Promise<DataWidget>;

export const wrappedWidgetDataType = new DataTypeStringArg<
  WrappedWidgetCreator
>("application/x.jupyter.wrapped-widget", "label");

export const wrapWidgetConverter = widgetDataType.createSingleTypedConverter(
  wrappedWidgetDataType,
  (label, url) => {
    return [
      label,
      [
        1,
        map(creator => async () => new DataWidget(await creator(), url, label))
      ]
    ];
  }
);

export function widgetViewerConverter(
  display: (widget: Widget) => Promise<void>
): Converter<WrappedWidgetCreator, View> {
  return wrappedWidgetDataType.createSingleTypedConverter(
    viewerDataType,
    label => [label, [1, map(creator => async () => display(await creator()))]]
  );
}
