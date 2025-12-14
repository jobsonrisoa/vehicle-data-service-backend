export abstract class BaseValueObject<T> {
  protected readonly props: T;

  protected constructor(props: T) {
    this.props = Object.freeze(props);
  }

  abstract equals(other: BaseValueObject<T>): boolean;
}
