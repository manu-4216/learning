let employee: object;

employee = {
  firstName: 'John',
  lastName: 'Doe',
  age: 25,
  jobTitle: 'Web Developer',
};

console.log(employee);

// Drawbacks:
// - no autocomplete.
// - Generic type inside errors (Property `blah` doesn't exist on type `object`)

// error if trying these:
employee = 'jab';

console.log(employee.blah);

// One other way to declare types:
let employee2: {
  firstName: string;
  lastName: string;
  age: number;
  jobTitle: string;
};
employee2 = {
  firstName: 'John',
  lastName: 'Doe',
  age: 25,
  jobTitle: 'Web Developer',
};

// Autocomplete works !
employee2.age;

// Or you can combine both syntaxes in the same statement like this:
let employee3: {
  firstName: string;
  lastName: string;
  age: number;
  jobTitle: string;
} = {
  firstName: 'John',
  lastName: 'Doe',
  age: 25,
  jobTitle: 'Web Developer',
};

// The empty type {}
// TypeScript has another type called empty type denoted by {} , which is quite similar to the object type.
// But you can access all properties and methods declared on the Object type, which is available on the object via prototype chain:
let vacant: {} = {};

console.log(vacant.toString());
