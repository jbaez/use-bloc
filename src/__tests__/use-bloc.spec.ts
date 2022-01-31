import { useBloc } from '..';
import { renderHook } from '@testing-library/react-hooks';

interface BlocClassParams {
  value: string;
  stateProp: string;
}

class BlocClass {
  value: string;
  stateProp: string;
  constructor({ value, stateProp }: BlocClassParams) {
    this.value = value;
    this.stateProp = stateProp;
  }

  updateParams({ value }: BlocClassParams) {
    this.value = value;
  }

  dispose = jest.fn();
}

BlocClass.prototype.dispose = jest.fn();

describe('useBloc custom hook', () => {
  it('creates a BLoC instance, reuses it between rerenders and keeps it updated', () => {
    const props: BlocClassParams = {
      value: 'test prop',
      stateProp: 'test state',
    };
    const hook = renderHook((props) => useBloc(BlocClass, props), {
      initialProps: props,
    });
    const initialBloc = hook.result.current;
    expect(initialBloc.value).toEqual(props.value);
    expect(hook.result.current.stateProp).toEqual(props.stateProp);
    // rerender with same props
    hook.rerender(props);
    let bloc = hook.result.current;
    expect(bloc.value).toEqual(props.value);
    expect(bloc.stateProp).toEqual(props.stateProp);
    expect(bloc).toBe(initialBloc);
    // rerender with updated props
    hook.rerender({ ...props, value: 'updated prop value' });
    bloc = hook.result.current;
    expect(bloc.value).toEqual('updated prop value');
    expect(bloc.stateProp).toEqual(props.stateProp);
    expect(bloc).toBe(initialBloc);
    expect(bloc.dispose).not.toHaveBeenCalled();
  });

  it('creates a BLoC instance and recreates it when state prop changes', () => {
    const props: BlocClassParams = {
      value: 'test prop',
      stateProp: 'test state',
    };
    const hook = renderHook(
      (props) => useBloc(BlocClass, props, ['stateProp']),
      {
        initialProps: props,
      }
    );
    const initialBloc = hook.result.current;
    expect(initialBloc.value).toEqual(props.value);
    expect(hook.result.current.stateProp).toEqual(props.stateProp);
    // rerender with update state prop
    hook.rerender({ ...props, stateProp: 'updated state' });
    const bloc = hook.result.current;
    expect(bloc.value).toEqual(props.value);
    expect(bloc.stateProp).toEqual('updated state');
    expect(bloc).not.toBe(initialBloc);
    expect(initialBloc.dispose).toHaveBeenCalledTimes(1);
  });
});
