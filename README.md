# use-bloc

React useBloc custom hook to use with BLoC pattern

## Introduction:

This hook is used for decoupling the business logic of the component based on the BLoC pattern. The implementation of the BLoC class "reactiveness" is open to use any library, custom pub/sub, etc. However, [MobX](https://mobx.js.org) is recommended for it's simplicity and performance. A implementation example can be found in this [article](https://dev.to/jbaez/decoupling-the-logic-from-the-ui-in-react-using-the-bloc-pattern-41e6).

`useBloc` hook returns a BLoC instance from the provided "constructor" and "properties" in the first and second parameters. It keeps the same instance for the lifetime of the component, or re-instantiates it automatically when using the optional third parameter (`recreate`) with a property key that has changed from it's previous value.

## Usage:

This is a minimal example that does not have state as it's just for showing the usage of the library. If the component is stateless and doesn't have any business logic then it probably doesn't need a BLoC.

### JavaScript example:

```jsx
import React from 'react';
import { useBloc } from 'use-bloc';

class MyComponentBloc {
  constructor(props) {
    this.title = props.title;
  }
  updateParams(props) {
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

If using TypeScript `BlocInterface` can be added somewhere in the project for additional type-check.
(The interface is not provided by `use-bloc` library to make it easier to switch UI library/framework without modifying the BLoC class)

```typescript
export type BlocInterface<P> = {
  dispose?: () => void;
  updateParams?: (params: P) => void;
} & object;
```

```tsx
import React from 'react';
import { useBloc } from 'use-bloc';
import { BlocInterface } from './bloc-interface';

interface MyComponentParams {
  title: string;
}

class MyComponentBloc implements BlocInterface<MyComponentParams> {
  title: string;
  constructor(props: MyComponentParams) {
    this.title = props.title;
  }
  updateParams(props: MyComponentParams) {
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

### Using `recreate` parameter

In the previous example, to re-instantiate the BLoC every time the `title` property changes:

```javascript
const bloc = useBloc(MyComponentBloc, props, ['title']);
```

### Disposing of resources

When the component is removed from the DOM, if the BLoc has subscriptions, timers, references, etc. they would need to be disposed. For that there is an optional `dispose` method that the BLoC class can implement.

```javascript
class MyComponentBloc {
  dispose() {
    // dispose subscriptions, timers, references, etc
  }
}
```
