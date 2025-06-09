// A tuple works like an array with some additional considerations:
// - The number of elements in the tuple is fixed.
// - The types of elements are known, and need not be the same.

let skill: [string, number];
skill = ['Programming', 5];

// Error:
skill = [5, 'Programming'];

// Use tuples with data that is related to each other in a specific order.

// For example, you can use a tuple to define an RGB color that always comes in a three-number pattern:

let color: [number, number, number] = [255, 0, 0];
