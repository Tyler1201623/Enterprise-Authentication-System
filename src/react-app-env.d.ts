/// <reference types="react" />
/// <reference types="react-dom" />

declare namespace React {
  interface FormEvent<T = Element> {
    preventDefault(): void;
    stopPropagation(): void;
    target: EventTarget & T;
  }

  interface ChangeEvent<T = Element> {
    preventDefault(): void;
    stopPropagation(): void;
    target: EventTarget & T;
  }

  interface EventTarget {
    value: string;
  }
}
