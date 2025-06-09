const car = {
  paused: true,
  start() {
    if (this.paused) {
      console.log('Starting the engine');
    } else {
      console.log('Already started');
    }
  },
};

car.start();

// Type inference works in this case, but that's not the case allways

// Solution:
// add "this" as a "special argument" to the function type signature.
// After compilation to JS, "this" is removed.
interface Car {
  paused: boolean;
}
const car2 = {
  paused: true,
  start(this: Car) {
    if (this.paused) {
      console.log('Starting the engine');
    } else {
      console.log('Already started');
    }
  },
};

car2.start();
