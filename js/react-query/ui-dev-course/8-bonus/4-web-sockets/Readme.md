# Working with WebSockets

The web was designed around a request/response model, where the client requests data and the server responds. Once the response happens, the connection is closed, at least until another request is made.

This is a great model for on-demand applications, but terrible for real-time data since you basically have to continuously poll the server to get the latest updates, even if there hasn't even been an update.

This is the model which React Query uses by default.

To solve for this problem, whether it's by allowing you to manually invalidate queries via `queryClient.invalidateQueries`, or by giving you the ability to configure a `staleTime`, React Query comes with plenty of options to help you keep your data fresh.

However, for the most part, these options are just estimates around when you think data might be stale. Because data lives on the server, there's no way for React Query to know when it's actually stale or not – or is there?

Take this scenario. You have a real-time application where multiple users can interact with the same data. If one user makes a change, you want all the other users to see that change immediately, not just after `staleTime` has passed.

How would you go about this with React Query?

Well, in a similar way that you would without it – `Websockets`.

`Websockets` allow the client to create a long-running connection to the server. This allows both the client and server to send messages to each other at any time. Instead of polling, servers can either send a message to the clients telling them to fetch the latest data, or just send the data over the websocket.

The way this works is typically with some kind of publish or emit signal. A mutation of some kind comes in, either creating, updating, or deleting an existing records. Once the mutation is done making updates, it publishes a message to the websocket handler, which decides which connected clients should get the message. It then sends the appropriate data to those clients, which can react to it however they want.

🕸️Implementing `Websockets` by yourself takes a lot of effort, especially on the backend. The server has to manage every connection, and even for lean servers, this adds up quickly as your active user count grows.

Unless you're really into this kind of thing, you're most likely going to be using a library like `Socket.io` or a service, like `Pusher`, `PubNub`, or `Twilio`.

To keep this lesson simple, we'll just use the built-in `Websocket` client.

So how do we make `Websockets` work with React Query? Thankfully, assuming you've taken all the other lessons before this one, it's very simple.

As you saw, when dealing with mutations, there are two ways you can approach updating the data when the mutation is complete. If the mutation returns the updated data, you can use that to update the cache directly. If it doesn't, you can invalidate the appropriate queries once the mutation is complete.

With `Websockets`, we have similar options.

If our Websocket server is configured to send back all of the data that we need to update our cache, including the `queryKey` and the data to cache, then we could do that with `queryClient`.`setQueryData`. If it doesn't, we can just invalidate the query and let React Query handle the rest.

For this lesson, we'll focus on the latter.

First, we'll want to setup the subscription for the websocket. To do that, let's create a `useWebsocketQueryInvalidate` hook that encapsulates this logic. Before we worry about anything to do with React Query, let's get the Websocket subscription working.

Setting up the subscription is a side effect, so we'll throw it in `useEffect`.

```js
export function useWebsocketQueryInvalidate() {
  React.useEffect(() => {
    const handleMessage = (event) => {
      const queryKey = JSON.parse(event.data);


    }

    ws.addEventListener("message", handleMessage);

    return () => ws.removeEventListener("message", handleMessage);
  }, []);
}
```

Now if we invoke `useWebsocketQueryInvalidate` in our component, anytime a message is sent over the `websocket`, our `handleMessage` function will be called.

From here, all we have to do is call `invalidateQueries` with the `queryKey` we received from the message.

```js
export default function useWebsocketQueryInvalidate() {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const handleMessage = (event) => {
      const queryKey = JSON.parse(event.data);

      queryClient.invalidateQueries(queryKey);
    }

    ws.addEventListener("message", handleMessage);

    return () => ws.removeEventListener("message", handleMessage);
  }, [queryClient]);
}
```

The big advantage here is that for real apps, our Query will not only refetch when we make an update for ourselves, but whenever anyone makes an update and the server sends a message over the `Websocket`.

And if you want to rely entirely on the `Websocket` for updates, you can set the `staleTime` to `Infinity` so that React Query will only update the cache when the `Websocket` tells it to.

