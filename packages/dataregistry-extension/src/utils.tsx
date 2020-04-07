/**
 * @license BSD-3-Clause
 *
 * Copyright (c) 2019 Project Jupyter Contributors.
 * Distributed under the terms of the 3-Clause BSD License.
 */

import * as React from 'react';

import { Observable, Subscription, BehaviorSubject } from 'rxjs';

import { Widget } from '@lumino/widgets';
import { ISignal } from '@lumino/signaling';

interface IUseBehaviorSubjectProps<T> {
  subject: BehaviorSubject<T>;
  children: (value: T) => React.ReactNode;
}

export function UseBehaviorSubject<T>({
  subject,
  children
}: IUseBehaviorSubjectProps<T>) {
  return (
    <UseObservable observable={subject} initial={subject.value}>
      {children}
    </UseObservable>
  );
}

interface IUseObservableProps<T, U> {
  observable: Observable<T>;
  initial: U;
  children: (value: T | U) => React.ReactNode;
}
export class UseObservable<T, U> extends React.Component<
  IUseObservableProps<T, U>,
  { value: T | U }
> {
  private subscription!: Subscription;
  constructor(props: IUseObservableProps<T, U>) {
    super(props);
    this.state = { value: props.initial };
  }

  componentDidMount() {
    this.subscription = this.props.observable.subscribe({
      next: value => this.setState({ value })
    });
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  render() {
    return this.props.children(this.state.value);
  }
}

export function luminoWidget({ widget }: { widget: Widget }) {
  const el = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    Widget.attach(widget, el.current!);
    return () => Widget.detach(widget);
  }, [widget]);

  return <div className="scrollable jl-lumino-widget" ref={el} />;
}

export function signalToObservable<T, V>(
  signal: ISignal<T, V>
): Observable<[T, V]> {
  return new Observable(subscriber => {
    function slot(sender: T, value: V) {
      subscriber.next([sender, value]);
    }
    signal.connect(slot);
    return () => signal.disconnect(slot);
  });
}
