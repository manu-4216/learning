let skills: string[];

skills = [];

skills[0] = 'Problem Solving';

// You can also use inference:
let skills2 = ['Problem Solving', 'Software Design', 'Programming'];

// error:
skills2.push(100);

console.log(typeof skills[0]);

// TypeScript arrays can access the inbuilt properties and methods:
console.log(skills.length);

// Autocomplete of
skills.reduce();
