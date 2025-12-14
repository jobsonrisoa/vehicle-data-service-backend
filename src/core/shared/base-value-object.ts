export class BaseValueObject<T = unknown> {
  constructor(public readonly props: T) {}
}
