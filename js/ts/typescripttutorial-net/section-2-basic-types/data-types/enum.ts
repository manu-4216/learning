// Enum stands for enumerated type.

enum Month {
  Jan,
  Feb,
  Mar,
  Apr,
  May,
  Jun,
  Jul,
  Aug,
  Sep,
  Oct,
  Nov,
  Dec,
}

const month : Month = Month.Jan
console.log(month)

// Output:
{
  '0': 'Jan', 
  '1': 'Feb', 
  '2': 'Mar', 
  '3': 'Apr', 
  '4': 'May', 
  '5': 'Jun', 
  '6': 'Jul', 
  '7': 'Aug', 
  '8': 'Sep', 
  '9': 'Oct', 
  '10': 'Nov',
  '11': 'Dec',
  Jan: 0,     
  Feb: 1,     
  Mar: 2,     
  Apr: 3,     
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11
}

// As you can see clearly from the output, a TypeScript enum is an object in JavaScript. 
// This object has named properties declared in the enum. 
// For example, Jan is 0 and Feb is 1.

// Specifying enum members’ numbers

// TypeScript defines the numeric value of an enum’s member based on the order of that
// member that appears in the enum definition. For example, Jan takes 0, Feb gets 1, etc.

// It’s possible to explicitly specify numbers for the members of an enum like this:
enum Month {
  Jan = 1,
  Feb,
  Mar,
  Apr,
  May,
  Jun,
  Jul,
  Aug,
  Sep,
  Oct,
  Nov,
  Dec
};


// When to use an enum

// You should use an enum when you:

// - Have a small set of fixed values that are closely related
// - And these values are known at compile time.
