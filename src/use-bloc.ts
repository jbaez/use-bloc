import { useEffect, useRef, useMemo } from 'react';

type BlocInterface<P> = {
  dispose?: () => void;
} & Partial<BlocProps<P>>;

type BlocProps<P = Record<string, unknown>> = {
  [K in keyof P]: P[K];
};

type PropsKeys<P> = (keyof P)[];

interface BlocConstructor<T extends BlocInterface<P>, P> {
  new (props: BlocProps<P>): T;
}

/**
 * Use BLoC Hook
 */
export function useBloc<T extends BlocInterface<P>, P>(
  Bloc: BlocConstructor<T, P>,
  props: BlocProps<P>,
  options?: {
    stateProps?: PropsKeys<P>;
    defaults?: Partial<P>;
  }
) {
  const stateProps = options?.stateProps;
  const statePropsMap = useMemo<Map<keyof P, true> | undefined>(() => {
    if (!stateProps) {
      return;
    }
    return new Map(stateProps.map((stateProp) => [stateProp, true]));
  }, [stateProps]);

  const defaults = options?.defaults;
  const defaultKeys = useMemo(() => {
    return (defaults ? Object.keys(defaults) : []) as PropsKeys<P>;
  }, [defaults]);

  const propKeys = useMemo(() => {
    return Object.keys(props) as PropsKeys<P>;
  }, [props]);

  const allPropKeys = useMemo(() => {
    return new Set([...propKeys, ...defaultKeys]);
  }, [propKeys, defaultKeys]);

  const blocRef = useRef<T>();
  const propsRef = useRef<P>();

  if (!propsRef.current) {
    propsRef.current = props;
  }
  let firstInit = false;
  if (!blocRef.current) {
    blocRef.current = new Bloc(props);
    firstInit = true;
  } else if (statePropsMap && statePropsMap.size) {
    for (const [prop] of statePropsMap) {
      if (propsRef.current[prop] !== props[prop]) {
        blocRef.current = new Bloc(props);
        propsRef.current = props;
        firstInit = true;
        break;
      }
    }
  }
  const blocInstance = blocRef.current;

  if (!firstInit) {
    // update non-state props
    for (const key of allPropKeys) {
      if (statePropsMap?.has(key) || !(key in blocInstance)) {
        continue;
      }
      blocInstance[key] = (props[key] ?? defaults?.[key]) as T[typeof key];
    }
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
