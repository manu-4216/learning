# USER DEFINED TYPE GUARDS

This whole section has been about the _type guards_ which we can use to narrow the type of a value to be more specific. Examples include typeof, instanceof, in, and Array.isArray. Each of these is able to assert to TypeScript that a value either does or does not conform to some type.

We can define our own user-defined type guards too. These can be especially helpful when checking the type of a value is a complicated process, or if we want to reuse the same runtime checking logic in multiple places.

Suppose we have two interfaces. We can't modify these interfaces for some reason - perhaps they are part of a third-party library - so _we can't take advantage of Discriminating Unions_. However, _we still need some way to tell the difference between them_.

```ts
interface Fruit {
  name: string;
  color: string;
  sweetness: number;
}
interface Vegetable {
  name: string;
  color: string;
  tenderness: number;
}
```

A user defined type guard is a function that takes at least one argument, _returns a boolean_, and has a type predicate return signature. This is a special type signature which says "this value is most certainly this type".

```ts
function isFruit(maybeFruit: Fruit | Vegetable): maybeFruit is Fruit {
  if ('sweetness' in maybeFruit) return true;
  return false;
}

const tomato = { name: 'Tomato', color: 'red', tenderness: 70 };
if (isFruit(tomato)) {
  console.log(`Tomato is ${tomato.sweetness}% sweet.`);
} else {
  console.log(`Tomato is ${tomato.tenderness}% tender.`);
}

// "Tomato is 70% tender."
```

Our type predicate, maybeFruit is Fruit, tells us that if this function returns true, then maybeFruit is definitely a Fruit. Since tomato doesn't have a sweetness property, it is recognized as a Vegetable, which lets us access the tenderness property without warning.

We can define type guards on unknown and any types too, allowing us to easily narrow them to any type we like.

```ts
function isFruit(maybeFruit: any): maybeFruit is Fruit {
  if ('color' in maybeFruit) return true;
  return false;
}
```

While this would work some of the time, other times it might give us the wrong type. If we were to pass a Vegetable to this function, it would transform its type into a fruit. What if the color property were present on maybeFruit, but it was actually a number instead of a string?

If we wanted to, we could use user defined type guard functions to trick the TypeScript compiler that any value is any other type. Obviously, that would cause type errors in our program that TypeScript couldn't warn us about, so we should be as thorough as possible when writing the conditions in user defined type guards, especially if the type predicate is changing an any or unknown type to another type.

# Assertion Functions

Assertion functions are another kind of type guard that use a different method to tell the type checker what type a value has. Assertion functions allow you to _throw errors_ to assert a type condition. TypeScript isn't sophisticated enough to know whether a function that throws an error asserts any kind of types on your values. We have to add an assertion return signature to our assertion function to let TypeScript know that throwing an error proves something about a type.

There are two kinds of assertion return signatures. The first type asserts that a _boolean argument is true_. We have to pass in a argument, and then we can add asserts <parameter name> as our function return signature. If the function doesn't throw an error, it influences the type of the values used in the condition.

```ts
function assertTrue(condition: boolean): asserts condition {
  if (!condition) {
    throw new Error();
  }
}

const maybeFruitName: unknown = 'Banana';

assertTrue(typeof maybeFruitName === 'string');

maybeFruitName; // const maybeFruitName: string;
```

This works in a similar way to using if statements to return early, but it throws an error instead.

The second assertion return signature is written more like a type predicate. It allows us to _assert that if the function does not throw an error, a function argument is a specific type_.

```ts
function assertIsFruit(maybeFruit: any): asserts maybeFruit is Fruit {
  if (!('sweetness' in maybeFruit)) throw new Error();
}

const tomato = { name: 'Tomato', color: 'red', tenderness: 70 };
assertIsFruit(tomato);

tomato; // const tomato: Fruit
```

Both Assertion Functions and Type Predicates allow us to write functions which assert or prove something about the types of the values which are passed into them, giving us more flexibility with how we perform runtime type checks of our values.

# Exercises

```ts
function isString(maybeString: unknown): maybeString is string {
  return typeof maybeString === 'string';
}
function isFruit(maybeFruit: unknown): maybeFruit is Fruit {
  if (maybeFruit && typeof maybeFruit === 'object') {
    if ('color' in maybeFruit && 'sweetness' in maybeFruit && 'name' in maybeFruit) {
      const actualFruit: Fruit = maybeFruit as Fruit;
      if (typeof actualFruit.name === 'string' && typeof actualFruit.sweetness === 'number') {
        return true;
      }
    }
  }
  return false;
}
function assertIsFruit(maybeFruit: unknown): asserts maybeFruit is Fruit {
  if (maybeFruit && typeof maybeFruit === 'object') {
    if ('color' in maybeFruit && 'sweetness' in maybeFruit && 'name' in maybeFruit) {
      const actualFruit: Fruit = maybeFruit as Fruit;
      if (typeof actualFruit.name === 'string' && typeof actualFruit.sweetness === 'number') {
        return;
      }
    }
  }
  throw new Error();
}
```
