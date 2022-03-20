# use-bloc

React useBloc custom hook to use with BLoC pattern

## Introduction:

This hook is used for decoupling the business logic of the component using the BLoC pattern. The implementation of the BLoC class "reactiveness" is open to use any library, custom pub/sub, etc. However, [MobX](https://mobx.js.org) is recommended for it's simplicity and performance. An implementation example can be found in this [article](https://dev.to/jbaez/decoupling-the-logic-from-the-ui-in-react-using-the-bloc-pattern-41e6).

The `useBloc` hook returns a BLoC instance from the provided "constructor" and "props" in the first and second parameters. It keeps the same instance for the lifetime of the component, or re-instantiates it automatically if props used for state change see TODO

```jsx
const bloc = useBloc(MyComponentBloc, props, {
  stateProps: ['myStateProp'],
});
```

## Rules:

The `useBloc` hook since v2 updates automatically the props when they change. This allows to reduce the boilerplate and code repetition when creating BLoC classes. For that to work properly these rules should be followed:

- The BLoC class should define properties with the same name as the props that are not used for state.
- Props that are used for state should be provided in the `stateProps` property of the `options` param. [Using options parameter](#using-options-parameter)
- Props that have default values should be provided in the `defaults` property of the `options` param. [Using options parameter](#using-options-parameter)

## Usage:

This is a minimal example that does not have state props, since the reactive handling of state changes depends on the library or custom implementation used.
If the component is stateless and doesn't have any business logic then it probably doesn't need a BLoC.

### JavaScript example:

```jsx
import React from 'react';
import { useBloc } from 'use-bloc';

class MyComponentBloc {
  constructor(props) {
    this.title = props.title;
  }
}

const MyComponent = (props) => {
  const bloc = useBloc(MyComponentBloc, props);
  return (
    <div>
      <h1>{bloc.title}</h1>
    </div>
  );
};
```

### TypeScript example:

```tsx
import React from 'react';
import { useBloc } from 'use-bloc';

interface MyComponentParams {
  title: string;
}

class MyComponentBloc {
  title: string;
  constructor(props: MyComponentParams) {
    this.title = props.title;
  }
}

const MyComponent = (props: MyComponentParams) => {
  const bloc = useBloc(MyComponentBloc, props);
  return (
    <div>
      <h1>{bloc.title}</h1>
    </div>
  );
};
```

### Using options parameter

Components may define props that would be used for state, like for example to set the initial value. If one of those prop changes, the BLoC instance needs to be re-created since the initial value is now different. For that, the `options` parameter and `stateProps` should be used by passing an array of those prop keys that are used for state.

Components may have optional props with default values in the BLoC class. These default props should be passed in the `defaults` property of the `options` parameter, so they are used if needed when updating the props after a re-render.

An example of using stateProps and defaults in a Checkbox Component (demo example without reactive state handling):

```typescript
import React from 'react';
import { useBloc } from 'use-bloc';

// Checkbox BLoC
interface CheckboxParams {
  checked?: boolean;
  label?: string;
  onChange?: OnChange;
}

const defaults: Partial<CheckboxParams> &
  Required<Pick<CheckboxParams, 'checked' | 'label'>> = {
  checked: false,
  label: 'Click me!',
};

class CheckboxBloc {
  checked: boolean;
  label: string;
  onChange?: OnChange;

  constructor(params: CheckboxParams) {
    this.checked = params.checked ?? defaults.checked;
    this.label = params.label ?? defaults.label;
    this.onChange = params.onChange;
  }

  toggleChecked() {
    this.checked = !this.checked;
    if (this.onChange) {
      this.onChange(this.checked);
    }
  }
}
// Checkbox component
const Checkbox = (props: CheckboxParams) => {
  const bloc = useBloc(CheckboxBloc, props, {
    stateProps: ['checked'],
    defaults,
  });
  // ...
};
```

### Disposing resources

When the component is removed from the DOM, if the BLoc has subscriptions, timers, references, etc. they would need to be disposed. For that there is an optional `dispose` method that the BLoC class can implement if needed.

```javascript
class MyComponentBloc {
  dispose() {
    // dispose subscriptions, timers, references, etc
  }
}
```
