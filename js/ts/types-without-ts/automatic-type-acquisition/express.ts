// https://www.typescriptlang.org/docs/handbook/declaration-files/consumption.html
import express from 'express';

const port = 8080; // default port to listen
const app = express();

// define a route handler for the default home page
app.get('/', (req, res) => {
  req.res.send('Hello world!');
});

app.listen(port, () => {
  // tslint:disable-next-line:no-console
  console.log(`server started at http://localhost:${port}`);
});

console.log('SpecialType');
