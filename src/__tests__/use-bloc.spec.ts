import { useBloc, hydrateBloc } from '..';
import { renderHook } from '@testing-library/react-hooks';

//
// Test BLoC Stubs
//

// BLoC Props interface
interface BlocProps {
  value: string;
  stateProp: string;
  optionalValue?: string;
  mandatoryValue?: string; // optional prop
  optionalWithoutDefault?: string;
  optionalArray?: string[];
  optionalObject?: object;
  optionalDate?: Date;
}
// Default props
type BlocDefaults = Partial<BlocProps> &
  Required<Pick<BlocProps, 'mandatoryValue'>>;
const defaults: BlocDefaults = Object.freeze({
  optionalValue: 'default optional value',
  mandatoryValue: 'default mandatory value',
});
// State props
type StateProps = (keyof BlocProps)[];
const stateProps: StateProps = ['stateProp'];
// BLoC stub props
type BlocStubProps = BlocProps & BlocDefaults;
// BLoC stub
class BlocStub implements BlocStubProps {
  value!: string;
  stateProp!: string;
  optionalValue?: string;
  mandatoryValue!: string;
  optionalWithoutDefault?: string;
  optionalArray?: string[];
  optionalObject?: object;
  optionalDate?: Date;

  constructor(props: BlocProps) {
    hydrateBloc(this, props, defaults);
  }
  dispose = jest.fn();
}
// BLoC stub manual
class BlocStubManual implements BlocStubProps {
  value: string;
  stateProp: string;
  optionalValue?: string;
  mandatoryValue: string;
  optionalWithoutDefault?: string;
  optionalArray?: string[];
  optionalObject?: object;

  constructor(props: BlocProps) {
    this.value = props.value;
    this.stateProp = props.stateProp;
    this.optionalValue = props.optionalValue ?? defaults.optionalValue;
    this.mandatoryValue = props.mandatoryValue ?? defaults.mandatoryValue;
    this.optionalWithoutDefault = props.optionalWithoutDefault;
  }
  updateProps = jest.fn(); // intentionally do nothing on implementation
  dispose = jest.fn();
}
// BLoC Stub simple
class BlocStubSimple {
  value: string;
  stateProp: string;

  constructor({ value, stateProp }: BlocProps) {
    this.value = value;
    this.stateProp = stateProp;
  }
  init = jest.fn();
}

//
// useBloc Specs
//

describe('useBloc custom hook', () => {
  it('calls init on first render (if defined)', () => {
    const initialProps: BlocProps = {
      value: 'test prop',
      stateProp: 'test state',
    };
    const hook = renderHook(
      (props) => useBloc(BlocStubSimple, props, ['stateProp']),
      {
        initialProps,
      }
    );
    const initialBloc = hook.result.current;
    expect(initialBloc.init).toHaveBeenCalledTimes(1);
    // should not be called again on re-render
    hook.rerender(initialProps);
    let currentBloc = hook.result.current;
    expect(currentBloc).toBe(initialBloc);
    expect(currentBloc.init).toHaveBeenCalledTimes(1);
    // should not be called again on a re-render due to a prop change
    let updatedProps: BlocProps = { ...initialProps, value: 'updated value' };
    hook.rerender(updatedProps);
    currentBloc = hook.result.current;
    expect(currentBloc).toBe(initialBloc);
    expect(currentBloc.init).toHaveBeenCalledTimes(1);
    // should be called again if a state related prop has changed, causing recreating the bloc
    updatedProps = { ...updatedProps, stateProp: 'updated state' };
    hook.rerender(updatedProps);
    currentBloc = hook.result.current;
    expect(currentBloc).not.toBe(initialBloc);
    expect(currentBloc.init).toHaveBeenCalledTimes(1);
    expect(initialBloc.init).toHaveBeenCalledTimes(1); // no extra call on initial bloc
  });

  it('hydrates the BLoC class with values from props and defaults', () => {
    const isoDate = '2022-05-19T10:17:14.243Z';
    const props: BlocProps = {
      value: 'test prop',
      stateProp: 'test state',
      optionalWithoutDefault: 'test optional without default',
      optionalArray: ['one', 'two', 'three'],
      optionalObject: { one: 1, two: 2, three: 3 },
      optionalDate: new Date(isoDate),
    };
    const bloc = new BlocStub(props);
    expect(bloc.value).toEqual(props.value);
    expect(bloc.stateProp).toEqual(props.stateProp);
    expect(bloc.optionalWithoutDefault).toEqual(props.optionalWithoutDefault);
    expect(bloc.optionalValue).toEqual(defaults.optionalValue);
    expect(bloc.mandatoryValue).toEqual(defaults.mandatoryValue);
    expect(bloc.optionalArray).not.toBe(props.optionalArray);
    expect(bloc.optionalObject).not.toBe(props.optionalObject);
    expect(bloc.optionalArray).toEqual(props.optionalArray);
    expect(bloc.optionalObject).toEqual(props.optionalObject);
    expect(bloc.optionalDate).toBeInstanceOf(Date);
    expect(bloc.optionalDate.valueOf() - new Date(isoDate).valueOf()).toEqual(
      0
    );
  });

  it('creates a BLoC instance, reuses it between rerenders and keeps it updated', () => {
    const props: BlocProps = {
      value: 'test prop',
      stateProp: 'test state',
      optionalValue: 'test optional',
      mandatoryValue: 'test mandatory',
      optionalArray: ['one', 'two', 'three'],
      optionalObject: { one: 1, two: 2, three: 3 },
    };
    const hook = renderHook(
      (props) => useBloc(BlocStub, props, { stateProps, defaults }),
      {
        initialProps: props,
      }
    );
    const initialBloc = hook.result.current;
    expect(initialBloc.value).toEqual(props.value);
    expect(initialBloc.stateProp).toEqual(props.stateProp);
    expect(initialBloc.optionalValue).toEqual(props.optionalValue);
    expect(initialBloc.mandatoryValue).toEqual(props.mandatoryValue);
    expect(initialBloc.optionalWithoutDefault).toBeUndefined();
    expect(initialBloc.optionalArray).not.toBe(props.optionalArray);
    expect(initialBloc.optionalObject).not.toBe(props.optionalObject);
    expect(initialBloc.optionalArray).toEqual(props.optionalArray);
    expect(initialBloc.optionalObject).toEqual(props.optionalObject);
    // rerender with same props
    hook.rerender(props);
    let bloc = hook.result.current;
    expect(bloc.value).toEqual(props.value);
    expect(bloc.stateProp).toEqual(props.stateProp);
    expect(bloc.optionalValue).toEqual(props.optionalValue);
    expect(bloc.mandatoryValue).toEqual(props.mandatoryValue);
    expect(bloc.optionalWithoutDefault).toBeUndefined();
    expect(bloc.optionalArray).toEqual(props.optionalArray);
    expect(bloc.optionalObject).toEqual(props.optionalObject);
    expect(bloc).toBe(initialBloc);
    // rerender with updated props
    let updatedProps: BlocProps = {
      ...props,
      value: 'updated prop value',
      optionalArray: ['four', 'five', 'six'],
      optionalObject: { four: 4, five: 5, six: 6 },
    };
    hook.rerender(updatedProps);
    bloc = hook.result.current;
    expect(bloc.value).toEqual('updated prop value');
    expect(bloc.stateProp).toEqual(updatedProps.stateProp);
    expect(bloc.optionalValue).toEqual(updatedProps.optionalValue);
    expect(bloc.mandatoryValue).toEqual(updatedProps.mandatoryValue);
    expect(bloc.optionalWithoutDefault).toBeUndefined();
    expect(bloc.optionalArray).not.toBe(updatedProps.optionalArray);
    expect(bloc.optionalObject).not.toBe(updatedProps.optionalObject);
    expect(bloc.optionalArray).toEqual(updatedProps.optionalArray);
    expect(bloc.optionalObject).toEqual(updatedProps.optionalObject);
    expect(bloc).toBe(initialBloc);
    expect(bloc.dispose).not.toHaveBeenCalled();
    // rerender with added props
    updatedProps = {
      ...props,
      optionalWithoutDefault: 'test optional without default',
    };
    hook.rerender(updatedProps);
    bloc = hook.result.current;
    expect(bloc.value).toEqual(updatedProps.value);
    expect(bloc.stateProp).toEqual(updatedProps.stateProp);
    expect(bloc.optionalValue).toEqual(updatedProps.optionalValue);
    expect(bloc.mandatoryValue).toEqual(updatedProps.mandatoryValue);
    expect(bloc.optionalWithoutDefault).toEqual(
      updatedProps.optionalWithoutDefault
    );
    expect(bloc).toBe(initialBloc);
    expect(bloc.dispose).not.toHaveBeenCalled();
  });

  it('creates a BLoC instance and recreates it when the state prop changes', () => {
    const props: BlocProps = {
      value: 'test prop',
      stateProp: 'test state',
      optionalValue: 'test optional',
      mandatoryValue: 'test mandatory',
    };
    const hook = renderHook(
      (props) => useBloc(BlocStub, props, { stateProps, defaults }),
      {
        initialProps: props,
      }
    );
    const initialBloc = hook.result.current;
    expect(initialBloc.value).toEqual(props.value);
    expect(initialBloc.stateProp).toEqual(props.stateProp);
    expect(initialBloc.optionalValue).toEqual(props.optionalValue);
    expect(initialBloc.mandatoryValue).toEqual(props.mandatoryValue);
    expect(initialBloc.optionalWithoutDefault).toBeUndefined();
    // rerender with update state prop
    hook.rerender({ ...props, stateProp: 'updated state' });
    const bloc = hook.result.current;
    expect(bloc.value).toEqual(props.value);
    expect(bloc.stateProp).toEqual('updated state');
    expect(bloc.optionalValue).toEqual(props.optionalValue);
    expect(bloc.mandatoryValue).toEqual(props.mandatoryValue);
    expect(bloc.optionalWithoutDefault).toBeUndefined();
    expect(bloc).not.toBe(initialBloc);
    expect(initialBloc.dispose).toHaveBeenCalledTimes(1);
  });

  it('updates BLoC instance using defaults props if provided', () => {
    const props: BlocProps = {
      value: 'test prop',
      stateProp: 'test state',
      optionalValue: 'test optional',
      mandatoryValue: 'test mandatory',
    };
    const hook = renderHook(
      (props) => useBloc(BlocStub, props, { stateProps, defaults }),
      {
        initialProps: props,
      }
    );
    const initialBloc = hook.result.current;
    expect(initialBloc.value).toEqual(props.value);
    expect(initialBloc.stateProp).toEqual(props.stateProp);
    expect(initialBloc.optionalValue).toEqual(props.optionalValue);
    expect(initialBloc.mandatoryValue).toEqual(props.mandatoryValue);
    expect(initialBloc.optionalWithoutDefault).toBeUndefined();
    // rerender with optional and mandatory props removed so it would use defaults
    const updatedProps: BlocProps = {
      value: props.value,
      stateProp: props.stateProp,
    };
    hook.rerender(updatedProps);
    const bloc = hook.result.current;
    expect(bloc.value).toEqual(props.value);
    expect(bloc.stateProp).toEqual(props.stateProp);
    expect(bloc.optionalValue).toEqual(defaults.optionalValue);
    expect(bloc.mandatoryValue).toEqual(defaults.mandatoryValue);
    expect(bloc.optionalWithoutDefault).toBeUndefined();
  });

  it('updates bloc manually if instead of options an array of stateProps is used', () => {
    const props: BlocProps = {
      value: 'test prop',
      stateProp: 'test state',
      optionalValue: 'test optional',
      mandatoryValue: 'test mandatory',
    };
    const hook = renderHook(
      (props) => useBloc(BlocStubManual, props, stateProps),
      {
        initialProps: props,
      }
    );
    const initialBloc = hook.result.current;
    expect(initialBloc.value).toEqual(props.value);
    expect(initialBloc.stateProp).toEqual(props.stateProp);
    expect(initialBloc.optionalValue).toEqual(props.optionalValue);
    expect(initialBloc.mandatoryValue).toEqual(props.mandatoryValue);
    expect(initialBloc.optionalWithoutDefault).toBeUndefined();
    // rerender with optional and mandatory props removed so it would use defaults
    const updatedProps: BlocProps = {
      value: 'new update value',
      stateProp: props.stateProp,
    };
    hook.rerender(updatedProps);
    const bloc = hook.result.current;
    expect(bloc.updateProps).toHaveBeenCalledTimes(1);
    expect(bloc.updateProps).toHaveBeenCalledWith(updatedProps);
    // since `updateProps` implementation is empty the values should be the same
    expect(bloc.value).toEqual(props.value);
    expect(bloc.stateProp).toEqual(props.stateProp);
    expect(bloc.optionalValue).toEqual(props.optionalValue);
    expect(bloc.mandatoryValue).toEqual(props.mandatoryValue);
    expect(bloc.optionalWithoutDefault).toBeUndefined();
  });

  it('prevents auto updates when an empty array of state props is used', () => {
    const props: BlocProps = {
      value: 'test prop',
      stateProp: 'test state',
      optionalValue: 'test optional',
      mandatoryValue: 'test mandatory',
    };
    const hook = renderHook((props) => useBloc(BlocStubManual, props, []), {
      initialProps: props,
    });
    const updatedProps: BlocProps = {
      value: 'new update value',
      stateProp: props.stateProp,
    };
    hook.rerender(updatedProps);
    const bloc = hook.result.current;
    expect(bloc.updateProps).toHaveBeenCalledTimes(1);
    expect(bloc.updateProps).toHaveBeenCalledWith(updatedProps);
    // since `updateProps` implementation is empty the values should be the same
    expect(bloc.value).toEqual(props.value);
    expect(bloc.stateProp).toEqual(props.stateProp);
    expect(bloc.optionalValue).toEqual(props.optionalValue);
    expect(bloc.mandatoryValue).toEqual(props.mandatoryValue);
    expect(bloc.optionalWithoutDefault).toBeUndefined();
  });
});
