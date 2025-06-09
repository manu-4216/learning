// How to narrow the type of an object?
interface Fruit {
  type: 'fruit';
  name: string;
  color: string;
  juice: () => void;
}

interface Vegetable {
  type: 'vegetable';
  name: string;
  color: string;
  steam: () => void;
}

type EdibleThing = Fruit | Vegetable; // discriminating union

function prepareEdibleThing(food: EdibleThing) {
  if (food.type === 'fruit') {
    food.juice();
  }
  if (food.type === 'vegetable') {
    food.steam();
  }
}

// This only works because all of the members of the Union have a similar property, but the property doesn't have to be a literal type.
// As long as the type is different for each of the members, we can check against it.

type StringResult = { error: Error; data: null } | { error: null; data: string };

function handleResult(result: StringResult) {
  if (result.error) {
    // Handle the error, which we know is an Error type
  }

  return result.data;
}
