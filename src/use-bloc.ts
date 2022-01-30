import { useEffect, useRef } from 'react';

type BlocInterface<P> = {
  dispose?: () => void;
  updateParams?: (params: P) => void;
} & object;

type BlocParams<T = Record<string, unknown>> = {
  [P in keyof T]: T[P];
};

export interface BlocConstructor<T extends BlocInterface<P>, P> {
  new (params: BlocParams<P>): T;
}

export default function useBloc<T extends BlocInterface<P>, P>(
  Bloc: BlocConstructor<T, P>,
  params: BlocParams<P>,
  recreate?: (keyof P)[]
) {
  const blocRef = useRef<T>();
  const paramsRef = useRef<P>();
  if (!paramsRef.current) {
    paramsRef.current = params;
  }
  let firstInit = false;
  if (!blocRef.current) {
    blocRef.current = new Bloc(params);
    firstInit = true;
  } else if (recreate && recreate.length) {
    for (const param of recreate) {
      if (paramsRef.current[param] !== params[param]) {
        blocRef.current = new Bloc(params);
        paramsRef.current = params;
        firstInit = true;
        break;
      }
    }
  }
  const blocInstance = blocRef.current;

  if (!firstInit && blocInstance.updateParams) {
    blocInstance.updateParams(params);
  }
  useEffect(() => {
    return () => {
      if (blocInstance.dispose) {
        blocInstance.dispose();
      }
    };
  }, [blocInstance]);
  return blocInstance;
}
