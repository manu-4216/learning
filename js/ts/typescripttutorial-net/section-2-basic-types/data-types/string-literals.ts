// WHAT:  define a type that accepts only one specified string literal.

// The following defines a string literal type that accepts a literal string 'click':
let click: 'click';

click = 'dblclick'; // compiler error

// The string literal types can combine nicely with the union types to define a finite set of
// string literal values for a variable:
let mouseEvent: 'click' | 'dblclick' | 'mouseup' | 'mousedown';
mouseEvent = 'click'; // valid
mouseEvent = 'dblclick'; // valid
mouseEvent = 'mouseup'; // valid
mouseEvent = 'mousedown'; // valid
mouseEvent = 'mouseover'; // compiler error

// If you use the string literal types in multiple places, they will be very verbose.
// To avoid this, you can use the type aliases. For example:
type MouseEvent2 = 'click' | 'dblclick' | 'mouseup' | 'mousedown';
let mouseEvent2: MouseEvent2;
mouseEvent2 = 'click'; // valid
