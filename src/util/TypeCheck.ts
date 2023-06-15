export type TypeChecker<T> = (v: any) => v is T;
export type ExtractTypeFromTypeChecker<Checker extends TypeChecker<any>> =
  Checker extends TypeChecker<infer T> ? T : never;

export type GenerateUnionChecker<Checkers extends TypeChecker<any>[]> =
  TypeChecker<ExtractTypeFromTypeChecker<Checkers[number]>>;

export const union = <Checkers extends TypeChecker<any>[]>(
  ...checkers: Checkers
): GenerateUnionChecker<Checkers> => {
  return (v: any): v is ExtractTypeFromTypeChecker<Checkers[number]> => {
    for (const checker of checkers) {
      if (checker(v)) return true;
    }
    return false;
  };
};

export const string: TypeChecker<string> = (v): v is string =>
  typeof v == "string";

export const number: TypeChecker<number> = (v): v is number =>
  typeof v == "number";
