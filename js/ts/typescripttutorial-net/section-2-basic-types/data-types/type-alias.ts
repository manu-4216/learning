// WHAT: create a new name for an existing type

type alias = existingType;

type chars = string;

let message: chars; // same as string type

// It’s useful to create type aliases for union types. For example:
type alphanumeric = string | number;
let input: alphanumeric;
input = 100; // valid
input = 'Hi'; // valid
input = false; // Compiler error
