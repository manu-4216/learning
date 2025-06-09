// Use case: define the type of an array, in which each element has a different type:

let simpleState: string;
function simpleUseState(initialState: string) {
  if (!simpleState) {
    simpleState = initialState;
  }
  function updateState(newState: string) {
    simpleState = newState;
  }
  return [simpleState, updateState];
}

const [username, setUsername] = simpleUseState('alexanderson');
// Type inference for arrays will use a union type (here: string | (string) => string)

setUsername('Alex'); // error, since TS think this might be a string

// SOLUTION: Tuples = are fixed-length arrays.
function simpleUseState2(initialState: string): [string, (newState: string) => void] {
  // The rest of the implementation goes here.
  return ['...', () => {}];
}

// Annotation syntax:
type UseStateReturnTuple = [string, () => {}];
