function name(parameter: type, parameter:type,...): returnType {
  // do something
}

function add(a: number, b: number): number {
  return a + b;
}

let sum = add('10', '20');

// Declaration
let add2: (x: number, y: number) => number;
// Note that the parameter names (x and y) are just for readability purposes. 
// As long as the types of parameters match, it is a valid type for the function.

// TypeScript compiler will match the number of parameters with their types and the return type.

// Reassign a function, whose type doesn’t match, to the add function variable:
add2 = function (x: string, y: string): number {
  return x.concat(y).length;
};

// To make a function parameter optional, you use the ? after the parameter name. For example
function multiply(a: number, b: number, c?: number): number {

  if (typeof c !== 'undefined') {
      return a * b * c;
  }
  return a * b;
}
