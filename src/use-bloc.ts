import { useEffect, useRef, useMemo } from 'react';

type BlocInterface = {
  dispose?: () => void;
  init?: () => void;
} & object;

type BlocManualInterface<P> = BlocInterface & {
  updateProps?: (props: BlocProps<P>) => void;
};

type BlocAutoInterface<P> = BlocInterface & P;

type AutoOptions<P> = {
  stateProps?: PropsKeys<P>;
  defaults?: Partial<P>;
};

type BlocProps<P> = {
  [K in keyof P]: P[K];
};

type PropKey<P> = keyof P;
type PropsKeys<P> = PropKey<P>[];

interface BlocConstructor<T extends BlocInterface, P> {
  new (props: BlocProps<P>): T;
}

/**
 * Returns the state props array as a map.
 */
function getStatePropMap<P>(
  stateProps?: PropsKeys<P>
): Map<PropKey<P>, true> | undefined {
  if (!stateProps) {
    return;
  }
  return new Map(stateProps.map((stateProp) => [stateProp, true]));
}

/**
 * Returns an array containing the keys of "props"
 */
function getPropKeys<P>(props: BlocProps<P>): PropsKeys<P> {
  return Object.keys(props) as PropsKeys<P>;
}

/**
 * Returns an array containing the keys of "defaults" if provided.
 */
function getDefaultKeys<P>(defaults?: Partial<P>): PropsKeys<P> {
  return (defaults ? Object.keys(defaults) : []) as PropsKeys<P>;
}

/**
 * Returns the propKeys and default keys merged into a single Set.
 */
function getAllPropKeys<P>(propKeys: PropsKeys<P>, defaultKeys: PropsKeys<P>) {
  return new Set([...propKeys, ...defaultKeys]);
}

/**
 * Sets the updated props in the bloc instance.
 */
function updateBloc<T extends BlocAutoInterface<P>, P, D extends Partial<P>>(
  bloc: T,
  props: BlocProps<P>,
  allPropKeys: Iterable<PropKey<P>>,
  defaults?: D,
  statePropsMap?: Map<PropKey<P>, true>
) {
  for (const key of allPropKeys) {
    if (statePropsMap?.has(key)) {
      continue;
    }
    let value: unknown = props[key] ?? defaults?.[key];
    if (Array.isArray(value)) {
      value = [...value];
    } else if (value !== null && typeof value == 'object') {
      value = { ...value };
    }
    bloc[key] = value as T[typeof key];
  }
}

/**
 * Hydrates a BLoC instance.
 * To be used in the constructor of the BLoC class.
 */
export function hydrateBloc<
  T extends BlocAutoInterface<P>,
  P,
  D extends Partial<P>
>(bloc: T, props: BlocProps<P>, defaults?: D) {
  const allPropKeys = getAllPropKeys(
    getPropKeys(props),
    getDefaultKeys(defaults)
  );
  updateBloc(bloc, props, allPropKeys, defaults);
}

/**
 * Use BLoC Hook
 */
export function useBloc<T extends BlocInterface, P>(
  Bloc: BlocConstructor<T, P>,
  props: BlocProps<P>,
  stateProps?: PropsKeys<P>
): T;

export function useBloc<T extends BlocAutoInterface<P>, P>(
  Bloc: BlocConstructor<T, P>,
  props: BlocProps<P>,
  options?: AutoOptions<P>
): T;

export function useBloc<T extends BlocAutoInterface<P>, P>(
  Bloc: BlocConstructor<T, P>,
  props: BlocProps<P>,
  options?: AutoOptions<P> | PropsKeys<P>
): T {
  const isManuallyUpdated = options && Array.isArray(options);

  const stateProps = isManuallyUpdated ? options : options?.stateProps;
  const statePropsMap = useMemo(
    () => getStatePropMap(stateProps),
    [stateProps]
  );

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

  if (firstInit && typeof blocInstance.init == 'function') {
    blocInstance.init();
  }

  if (isManuallyUpdated) {
    // manual prop update handling
    const blocManual: BlocManualInterface<P> = blocInstance;
    if (!firstInit && typeof blocManual.updateProps == 'function') {
      blocManual.updateProps(props);
    }
  } else {
    // automatic prop update handling
    const defaults = options?.defaults;
    const defaultKeys = useMemo(() => getDefaultKeys(defaults), [defaults]);
    const propKeys = useMemo(() => getPropKeys(props), [props]);
    const allPropKeys = useMemo(
      () => getAllPropKeys(propKeys, defaultKeys),
      [propKeys, defaultKeys]
    );
    if (!firstInit) {
      // update non-state props
      updateBloc(blocInstance, props, allPropKeys, defaults, statePropsMap);
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
