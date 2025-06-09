// @ts-check
// https://www.puruvj.dev/blog/get-to-know-typescript--using-typescript-without-typescript
// 

// Define type alias:
/**
 * @typedef {import("./types").ConversationResponse} ConversationResponse
 */

// Use it:
const req = await fetch('TWITTER_API_URL');

/** @type {ConversationResponse} */
const data = await req.json();

console.log(data.includes.users[0].) // autocomplete works
console.log(data.includes.abc) // autocomplete works
