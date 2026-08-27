# Multitent Worker Publisher

Publish isolated tenant Workers from a form, then serve them at `/{script-name}`.

Tenant source is stored in KV. Each request to a named path loads that source through a [Dynamic Worker](https://developers.cloudflare.com/dynamic-workers/getting-started/) (Worker Loader). No Cloudflare API token, account ID, or Workers for Platforms dispatch namespace is required.

## Run locally

```sh
npm install
npm run dev
```

Open the printed URL, enter a name such as `my-worker`, click **Deploy Worker**, and you will be redirected to `/my-worker`.

## Deploy

```sh
npx wrangler login
npx wrangler kv namespace create SCRIPTS
```

Put the returned id into `wrangler.jsonc` under `kv_namespaces[0].id`, then:

```sh
npm run deploy
```

Set `READONLY` to `"true"` in `vars` if you want to freeze new uploads.

## How it works

- `POST /deploy` with `{ scriptName, code }` writes the ES module to KV
- `GET /{scriptName}` loads that module with `env.LOADER.get()` and forwards the request
- Dynamic Workers are created with `globalOutbound: null` so tenant code cannot make outbound network calls
