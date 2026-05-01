export type CaseInsensitive<T extends string> =
  | T
  | Lowercase<T>
  | Uppercase<T>
  | Capitalize<Lowercase<T>>;
