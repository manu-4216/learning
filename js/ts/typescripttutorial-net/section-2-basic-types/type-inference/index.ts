// Hover over the items. TS is trying to guess the type. Sometimes it uses an union.
let items = [1, 2, 3, null, 'Hi'];

// Contextual typing
document.addEventListener('click', function (event) {
  // In this example, TypeScript knows that the `event` parameter is an instance of MouseEvent because of the click event
  console.log(event.button);
});

// In practice, you should always use the type inference as much as possible.

// And you use the type annotation in the following cases:
// - When you declare a variable and assign it a value later.
// - When you want a variable that can't be inferred.
// - When a function returns the `any` type and you need to clarify the value.
