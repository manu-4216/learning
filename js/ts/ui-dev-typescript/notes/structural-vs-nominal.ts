class Fruit {
  isFruit = true;
  constructor(public name: string) {}
}
class Apple extends Fruit {
  type: 'Apple' = 'Apple';
  constructor() {
    super('Apple');
  }
}
class Banana extends Fruit {
  type: 'Banana' = 'Banana';
  constructor() {
    super('Banana');
  }
}

// Why is this necessary when we can see those classes are named Apple and Banana?

// The reason for both of these extra bits of data is structural typing.
// This is the typing strategy which TypeScript uses to evaluate whether two types are compatible.
// It focuses on the shape of objects, and is often called "duck typing"

// If we didn't have the type properties, our Apple and Banana types would be indistinguishable,
// since they all would share the same property: name:string

// Adding those extra properties helps us distinguish between them, both in the type system and at runtime.

// Other programming languages, like Java and C# use a nominal type system. The word "nominal" refers to the
// name of the thing, which means if I were to create two classes with an identical structure, but different names,
// those two classes would be considered different.

// Like we saw with the Apple and Banana classes, we can emulate nominal typing by adding a unique property to our
// types with a string literal type. This practice is called "branding", or "tagging", and is what allowed us to
// differentiate between the two types in the type system.

let banana = new Apple(); // const banana: Apple
let apple: Apple = new Banana(); // Type 'Banana' is not assignable to type 'Apple'.

// This makes it possible to discriminate between types that may have the same structure, but different purposes.
// --------------------------------------------------------------------------------
// "branded primitives".

type USD = number & { _brand: 'USD' };
type EUR = number & { _brand: 'EUR' };

let income: USD = 10; // Type Error: Type 'number' is not assignable to type 'USD'.

// we have to use an assertion signature to convert our number type into the branded type:
let VAT = 10 as EUR;

function convertToUSD(input: EUR): USD {
  return (input * 1.18) as USD;
}

let VATInUSD = convertToUSD(VAT); // let VATInUSD = USD;
