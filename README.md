# Multitent Worker Publisher

Publish isolated tenant Workers from a form, then serve them at `/{script-name}`.

Tenant source is stored in a SQLite Durable Object. Each request to a named path loads that source through a [Dynamic Worker](https://developers.cloudflare.com/dynamic-workers/getting-started/) (Worker Loader). No Cloudflare API token, account ID, KV namespace, or Workers for Platforms dispatch namespace is required.

## Run locally

```sh
npm install
npm run dev
```

Open the printed URL, enter a name such as `my-worker`, click **Deploy Worker**, and you will be redirected to `/my-worker`.

## Deploy

```sh
npx wrangler login
npm run deploy
```

Set `READONLY` to `"true"` in `vars` if you want to freeze new uploads.

## How it works

- `POST /deploy` with `{ scriptName, code }` writes the ES module to Durable Object storage
- `GET /{scriptName}` loads that module with `env.LOADER.get()` and forwards the request
- Dynamic Workers are created with `globalOutbound: null` so tenant code cannot make outbound network calls
