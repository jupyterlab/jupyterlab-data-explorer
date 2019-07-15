import * as React from "react";

import { Observable, Subscription, BehaviorSubject } from "rxjs";

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
