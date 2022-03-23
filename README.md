# use-bloc

React useBloc custom hook to use with BLoC pattern

## Introduction:

This hook is used for decoupling the business logic of the component using the BLoC pattern. The implementation of the BLoC class "reactiveness" is open to use any library, custom pub/sub, etc. However, [MobX](https://mobx.js.org) is recommended for it's simplicity and performance. An implementation example can be found in this [article](https://dev.to/jbaez/decoupling-the-logic-from-the-ui-in-react-using-the-bloc-pattern-41e6).

The `useBloc` hook returns a BLoC instance from the provided "constructor" and "props" in the first and second parameters. It keeps the same instance for the lifetime of the component, or re-instantiates it automatically if props used for state change (`stateProps`).

There are 2 ways of using the hook:

#### Automatic BLoC props update

It updates automatically the props in the BLoC in each re-render.

```jsx
const bloc = useBloc(MyComponentBloc, props, {
  stateProps: ['myStateProp'],
});
```

#### Manual BLoC props update

The update of the props should be done manually by defining a `updateProps` function in the BLoC class, to update the provided props in the argument manually.

```jsx
const bloc = useBloc(MyComponentBloc, props, ['myStateProp']);
```

```ts
class MyComponentBloc {
  updateProps(props: MyComponentProps) {
    // manually update props
  }
}
```

Manual update can be forced even if there are no state props (even if the bloc doesn't define a `updateProps`) by using an empty array, since otherwise the default behaviour if no 3rd param is provided is to do automatic updates.

```jsx
const bloc = useBloc(MyComponentBloc, props, []);
```

## Automatic BLoC props update Rules:

This allows to reduce the boilerplate and code repetition when creating BLoC classes. For that to work properly these rules should be followed:

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

interface MyComponentProps {
  title: string;
}

class MyComponentBloc {
  title: string;
  constructor(props: MyComponentProps) {
    this.title = props.title;
  }
}

const MyComponent = (props: MyComponentProps) => {
  const bloc = useBloc(MyComponentBloc, props);
  return (
    <div>
      <h1>{bloc.title}</h1>
    </div>
  );
};
```

### Using Automatic BLoC options parameter

Components may define props that would be used for state, like for example to set the initial value. If one of those prop changes, the BLoC instance needs to be re-created since the initial value is now different. For that, the `options` parameter and `stateProps` should be used by passing an array of those prop keys that are used for state. This also applies to manual update mode when providing an array of `stateProps` instead of the options.

Components may have optional props with default values in the BLoC class. These default props should be passed in the `defaults` property of the `options` parameter, so they are used if needed when updating the props after a re-render.

An example of using stateProps and defaults in a Checkbox Component (demo example without reactive state handling):

```typescript
import React from 'react';
import { useBloc } from 'use-bloc';

// Checkbox BLoC
interface CheckboxProps {
  checked?: boolean;
  label?: string;
  onChange?: OnChange;
}

const defaults: Partial<CheckboxProps> &
  Required<Pick<CheckboxProps, 'checked' | 'label'>> = {
  checked: false,
  label: 'Click me!',
};

class CheckboxBloc {
  checked: boolean;
  label: string;
  onChange?: OnChange;

  constructor(props: CheckboxProps) {
    this.checked = props.checked ?? defaults.checked;
    this.label = props.label ?? defaults.label;
    this.onChange = props.onChange;
  }

  toggleChecked() {
    this.checked = !this.checked;
    if (this.onChange) {
      this.onChange(this.checked);
    }
  }
}
// Checkbox component
const Checkbox = (props: CheckboxProps) => {
  const bloc = useBloc(CheckboxBloc, props, {
    stateProps: ['checked'],
    defaults,
  });
  // ...
};
```

### Reducing initial BLoC props initialization boilerplate

When using Automatic BLoC mode, instead of manually initializing the BLoC props like in the previous example, `hydrateBloc` can be used:

```typescript
import { hydrateBloc } from 'use-bloc';

interface CheckboxProps {
  checked?: boolean;
  label?: string;
  onChange?: OnChange;
}

const defaults: Partial<CheckboxProps> &
  Required<Pick<CheckboxProps, 'checked' | 'label'>> = {
  checked: false,
  label: 'Click me!',
};

class CheckboxBloc {
  checked!: boolean;
  label!: string;
  onChange?: OnChange;

  constructor(props: CheckboxProps) {
    hydrateBloc(this, props, defaults);
  }

  toggleChecked() {
    this.checked = !this.checked;
    if (this.onChange) {
      this.onChange(this.checked);
    }
  }
}
```

Note that in TypeScript when defining the properties in the BLoC Class the definite assignment assertion `!` would need to be used (depending on TypeScript configuration) since the props are not longer directly initialized in the constructor.

### Disposing resources

When the component is removed from the DOM, if the BLoC has subscriptions, timers, references, etc. they would need to be disposed. For that there is an optional `dispose` method that the BLoC class can implement if needed.

```javascript
class MyComponentBloc {
  dispose() {
    // dispose subscriptions, timers, references, etc
  }
}
```
