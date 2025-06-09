// In TypeScript, function overloadings allow you to establish the relationship between the parameter types and result types of a function.

// To better describe the relationships between the types used by a function, TypeScript supports function overloadings. For example:
function add(a: number, b: number): number;
function add(a: string, b: string): string;
function add(a: any, b: any): any {
  return a + b;
}

let r = add(1, 2);
