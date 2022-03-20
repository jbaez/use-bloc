import { useBloc } from '..';
import { renderHook } from '@testing-library/react-hooks';

//
// Test BLoC Class
//

// BLoC Class Props interface
interface BlocClassProps {
  value: string;
  stateProp: string;
  optionalValue?: string;
  mandatoryValue?: string; // optional prop
  optionalWithoutDefault?: string;
}
// Default props
const defaults: Partial<BlocClassProps> &
  Required<Pick<BlocClassProps, 'mandatoryValue'>> = Object.freeze({
  optionalValue: 'default optional value',
  mandatoryValue: 'default mandatory value',
});
// BLoC Class
class BlocClass {
  value: string;
  stateProp: string;
  optionalValue?: string;
  mandatoryValue: string;
  optionalWithoutDefault?: string;
  constructor({
    value,
    stateProp,
    optionalValue,
    mandatoryValue,
    optionalWithoutDefault,
  }: BlocClassProps) {
    this.value = value;
    this.stateProp = stateProp;
    this.optionalValue = optionalValue ?? defaults.optionalValue;
    this.mandatoryValue = mandatoryValue ?? defaults.mandatoryValue;
    this.optionalWithoutDefault = optionalWithoutDefault;
  }
  dispose = jest.fn();
}

//
// useBloc Specs
//

describe('useBloc custom hook', () => {
  it('creates a BLoC instance, reuses it between rerenders and keeps it updated', () => {
    const props: BlocClassProps = {
      value: 'test prop',
      stateProp: 'test state',
      optionalValue: 'test optional',
      mandatoryValue: 'test mandatory',
    };
    const hook = renderHook((props) => useBloc(BlocClass, props), {
      initialProps: props,
    });
    const initialBloc = hook.result.current;
    expect(initialBloc.value).toEqual(props.value);
    expect(initialBloc.stateProp).toEqual(props.stateProp);
    expect(initialBloc.optionalValue).toEqual(props.optionalValue);
    expect(initialBloc.mandatoryValue).toEqual(props.mandatoryValue);
    expect(initialBloc.optionalWithoutDefault).toBeUndefined();
    // rerender with same props
    hook.rerender(props);
    let bloc = hook.result.current;
    expect(bloc.value).toEqual(props.value);
    expect(bloc.stateProp).toEqual(props.stateProp);
    expect(bloc.optionalValue).toEqual(props.optionalValue);
    expect(bloc.mandatoryValue).toEqual(props.mandatoryValue);
    expect(initialBloc.optionalWithoutDefault).toBeUndefined();
    expect(bloc).toBe(initialBloc);
    // rerender with updated props
    hook.rerender({ ...props, value: 'updated prop value' });
    bloc = hook.result.current;
    expect(bloc.value).toEqual('updated prop value');
    expect(bloc.stateProp).toEqual(props.stateProp);
    expect(bloc.optionalValue).toEqual(props.optionalValue);
    expect(bloc.mandatoryValue).toEqual(props.mandatoryValue);
    expect(initialBloc.optionalWithoutDefault).toBeUndefined();
    expect(bloc).toBe(initialBloc);
    expect(bloc.dispose).not.toHaveBeenCalled();
    // rerender with added props
    const updatedProps: BlocClassProps = {
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
    const props: BlocClassProps = {
      value: 'test prop',
      stateProp: 'test state',
      optionalValue: 'test optional',
      mandatoryValue: 'test mandatory',
    };
    const hook = renderHook(
      (props) => useBloc(BlocClass, props, { stateProps: ['stateProp'] }),
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
    expect(initialBloc.optionalWithoutDefault).toBeUndefined();
    expect(bloc).not.toBe(initialBloc);
    expect(initialBloc.dispose).toHaveBeenCalledTimes(1);
  });

  it('updates BLoC instance using defaults props if provided', () => {
    const props: BlocClassProps = {
      value: 'test prop',
      stateProp: 'test state',
      optionalValue: 'test optional',
      mandatoryValue: 'test mandatory',
    };
    const hook = renderHook(
      (props) =>
        useBloc(BlocClass, props, {
          stateProps: ['stateProp'],
          defaults, // provide default values for update
        }),
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
    const updatedProps: BlocClassProps = {
      value: props.value,
      stateProp: props.stateProp,
    };
    hook.rerender(updatedProps);
    const bloc = hook.result.current;
    expect(bloc.value).toEqual(props.value);
    expect(bloc.stateProp).toEqual(props.stateProp);
    expect(bloc.optionalValue).toEqual(defaults.optionalValue);
    expect(bloc.mandatoryValue).toEqual(defaults.mandatoryValue);
    expect(initialBloc.optionalWithoutDefault).toBeUndefined();
  });

  it('prevents updating BLoC instance with unknown props', () => {
    const props: BlocClassProps = {
      value: 'test prop',
      stateProp: 'test state',
      mandatoryValue: 'test mandatory',
    };

    const invalidDefaults: typeof defaults & { unknownValue: string } = {
      ...defaults,
      unknownValue: 'test unknown value',
    };

    const hook = renderHook(
      (props) =>
        useBloc(BlocClass, props, {
          stateProps: ['stateProp'],
          defaults: invalidDefaults,
        }),
      {
        initialProps: props,
      }
    );
    let bloc = hook.result.current;
    expect(bloc.optionalValue).toBe(defaults.optionalValue);
    // update bloc
    const updatedProps: BlocClassProps = {
      ...props,
      optionalValue: 'updated optional value',
    };
    hook.rerender(updatedProps);
    bloc = hook.result.current;
    // @ts-expect-error This is needed for testing this scenario
    expect(bloc.unknownValue).toBeUndefined();
    expect(bloc.optionalValue).toEqual('updated optional value');
  });
});
