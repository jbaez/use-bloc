import { useBloc, hydrateBloc } from '..';
import { renderHook } from '@testing-library/react-hooks';

//
// Test BLoC Class
//

// BLoC Props interface
interface BlocProps {
  value: string;
  stateProp: string;
  optionalValue?: string;
  mandatoryValue?: string; // optional prop
  optionalWithoutDefault?: string;
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
// BLoC Class props
type BlocClassProps = BlocProps & BlocDefaults;
// BLoC Class
class BlocClass implements BlocClassProps {
  value!: string;
  stateProp!: string;
  optionalValue?: string;
  mandatoryValue!: string;
  optionalWithoutDefault?: string;

  constructor(props: BlocProps) {
    hydrateBloc(this, props, defaults);
  }
  dispose = jest.fn();
}
// BLoC Class manual
class BlocClassManual implements BlocClassProps {
  value: string;
  stateProp: string;
  optionalValue?: string;
  mandatoryValue: string;
  optionalWithoutDefault?: string;

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

//
// useBloc Specs
//

describe('useBloc custom hook', () => {
  it('hydrates the BLoC class with values from props and defaults', () => {
    const props: BlocProps = {
      value: 'test prop',
      stateProp: 'test state',
      optionalWithoutDefault: 'test optional without default',
    };
    const bloc = new BlocClass(props);
    expect(bloc.value).toEqual(props.value);
    expect(bloc.stateProp).toEqual(props.stateProp);
    expect(bloc.optionalWithoutDefault).toEqual(props.optionalWithoutDefault);
    expect(bloc.optionalValue).toEqual(defaults.optionalValue);
    expect(bloc.mandatoryValue).toEqual(defaults.mandatoryValue);
  });

  it('creates a BLoC instance, reuses it between rerenders and keeps it updated', () => {
    const props: BlocProps = {
      value: 'test prop',
      stateProp: 'test state',
      optionalValue: 'test optional',
      mandatoryValue: 'test mandatory',
    };
    const hook = renderHook(
      (props) => useBloc(BlocClass, props, { stateProps, defaults }),
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
    const updatedProps: BlocProps = {
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
      (props) => useBloc(BlocClass, props, { stateProps, defaults }),
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
    const props: BlocProps = {
      value: 'test prop',
      stateProp: 'test state',
      optionalValue: 'test optional',
      mandatoryValue: 'test mandatory',
    };
    const hook = renderHook(
      (props) => useBloc(BlocClass, props, { stateProps, defaults }),
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

  it('uses `updateProps` BLoC function if set, instead of automatic prop update', () => {
    const props: BlocProps = {
      value: 'test prop',
      stateProp: 'test state',
      optionalValue: 'test optional',
      mandatoryValue: 'test mandatory',
    };
    const hook = renderHook(
      (props) => useBloc(BlocClassManual, props, { stateProps }),
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
});
