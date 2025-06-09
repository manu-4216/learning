// Why this works:
// jsdoc support: https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html
// - https://code.visualstudio.com/docs/nodejs/working-with-javascript

/**
 * @param {Application} a
 */
const sum = (a) => {
  const x = a.; // autocomplete just works
};
