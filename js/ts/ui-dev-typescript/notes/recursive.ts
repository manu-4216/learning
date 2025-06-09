const obj = {
  name: 'Yoti',
  type: 'SRL',
  billing: {
    contact: 'name',
    card: 'visa',
    nested: [
      {
        leaf: 22,
      },
    ],
  },
};

// Exercise: Extract the properties of a nested objected, like so: prop1, prop2, prop3.subprop1, ...
// Note the Prefix has both a constraint, and a default value ("")
type NestedPropertiesOf<Obj, Prefix extends string = ''> = keyof {
  [P in keyof Obj as `${Prefix}${Prefix extends '' ? '' : '.'}${Obj[P] extends object
    ? `${NestedPropertiesOf<Obj[P], P & string> & string}`
    : P & string}`]: any;
};

let r3: NestedPropertiesOf<typeof obj>;
