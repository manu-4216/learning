// The never type is a type that contains no values.
// Because of this, you cannot assign any value to a variable with a never type.

// Typically, you use the never type to represent the return type of a function that
// always throws an error:
function raiseError(message: string): never {
  throw new Error(message);
}

let ff = raiseError('');

// If you have a function expression that contains an indefinite loop,
// its return type is also the never type. For example:
let loop = function forever() {
  while (true) {
    console.log('Hello');
  }
};

// Specify that a branch can never happen, within type guard:
function fn(a: string | number): boolean {
  if (typeof a === 'string') {
    return true;
  } else if (typeof a === 'number') {
    return false;
  }
  // make the function valid
  return neverOccur();
}

let neverOccur = () => {
  throw new Error('Never!');
};
