// WHAT: represent an indefinite number of arguments as an array.

// The type of the rest parameter is an array type.

// To declare a rest parameter, you prefix the parameter name with three dots and use
// the array type as the type annotation:
function fn(...rest: type[]) {
  //...
}

function getTotal(...numbers: number[]): number {
  let total = 0;
  numbers.forEach((num) => (total += num));
  return total;
}

console.log(getTotal()); // 0
console.log(getTotal(10, 20)); // 30
console.log(getTotal(10, 20, 30)); // 60
