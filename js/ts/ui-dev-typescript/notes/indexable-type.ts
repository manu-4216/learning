// Analogy
// what if we are using a value in a variable to access a property dynamically?
// In JavaScript, we use square brackets to do that: someObj[someVariable]
type Fn = (...arg1: unknown[]) => unknown;
// extend interface via interface declaration merging:
interface Math {
  [dynamicProp: string]: Fn; // indexable type
}
// Call a dynamic property of `Math`
function getMathProperty(propertyName: string) {
  return Math[propertyName](); // Call any Math property dynamically
}

interface Fruit {
  name: string;
  [nutrients: string]: string; // indexable type
  color: string; // We can mix index signatures with regular property signatures,
  // as long as the key and value types match.
  // weight: number; // NOT allowed
}

const apple: Fruit = { name: 'Apple', color: 'red' };

apple.vitaminA = '50mg';
apple.vitaminC = '50mg';
