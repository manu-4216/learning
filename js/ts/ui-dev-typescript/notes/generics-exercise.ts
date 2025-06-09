/* eslint-disable @typescript-eslint/no-unused-vars */
// Change these functions into generic functions by altering the
// type signatures. There should be no `unknown` types when you are done
// function randomFromList<T extends any[]>(list: T): T {
function randomFromList<T>(list: T[]) {
  if (!Array.isArray(list)) {
    throw new Error('Only array input is supported');
  }
  const length = list.length;
  const index = Math.floor(Math.random() * length);
  return list[index];
}
const r1 = randomFromList([1, 2, 3]);
const r2 = randomFromList(['a', 'b', 'c']);

function duplicateList<T>(list: T[], count: number = 1) {
  let output: T[] = [];
  for (let i = 0; i < count; i++) {
    output = output.concat(list);
  }
  return output;
}
const t1 = duplicateList([1, 2, 3], 2);
const t2 = duplicateList(['a', 'b', 'c'], 2);

function createTuple<T, V>(item1: T, item2: V): [T, V] {
  return [item1, item2];
}
const v1 = createTuple(1, 'b');

// Use the following interface to constrain the generic in the next function
interface Length {
  length: number;
}
function getLength(item: Length) {
  return item.length;
}
const a1 = getLength([1, 2]);
const a2 = getLength('abc');
// NOTE: at runtime, we could still have wrong arguments. So we'd need extra runtime type checking to prevent this
const a3 = getLength(2);

function getLength2<T extends Length>(item: T) {
  return item.length;
}
const a12 = getLength2([1, 2]);
const a22 = getLength2('abc');
