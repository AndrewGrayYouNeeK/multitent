import { DurableObject } from "cloudflare:workers";
import { HTML_UI } from "./ui";

const SCRIPT_NAME_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
const RESERVED = new Set(["deploy", "favicon.ico"]);

export interface Env {
	LOADER: WorkerLoader;
	SCRIPT_STORE: DurableObjectNamespace<ScriptStore>;
	READONLY?: string | boolean;
}

export class ScriptStore extends DurableObject<Env> {
	private ready = false;

	private ensureTable(): void {
		if (this.ready) return;
		this.ctx.storage.sql.exec(
			"CREATE TABLE IF NOT EXISTS scripts (name TEXT PRIMARY KEY, code TEXT NOT NULL)",
		);
		this.ready = true;
	}

	async putScript(name: string, code: string): Promise<void> {
		this.ensureTable();
		this.ctx.storage.sql.exec(
			"INSERT OR REPLACE INTO scripts (name, code) VALUES (?, ?)",
			name,
			code,
		);
	}

	async getScript(name: string): Promise<string | null> {
		this.ensureTable();
		const row = this.ctx.storage.sql
			.exec("SELECT code FROM scripts WHERE name = ?", name)
			.toArray()[0] as { code: string } | undefined;
		return row?.code ?? null;
	}
}

function errorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	return String(error);
}

function isReadOnly(env: Env): boolean {
	return env.READONLY === "true" || env.READONLY === true;
}

function store(env: Env): DurableObjectStub<ScriptStore> {
	return env.SCRIPT_STORE.get(env.SCRIPT_STORE.idFromName("default"));
}

async function deployScript(
	env: Env,
	scriptName: string,
	code: string,
): Promise<{ script: string }> {
	if (!SCRIPT_NAME_RE.test(scriptName) || RESERVED.has(scriptName)) {
		throw new Error(
			"Script name must be 1–63 lowercase letters, numbers, or hyphens (and cannot be reserved)",
		);
	}
	if (!code.includes("export default")) {
		throw new Error("Worker code must be an ES module with export default");
	}

	await store(env).putScript(scriptName, code);
	return { script: scriptName };
}

async function runScript(
	env: Env,
	scriptName: string,
	request: Request,
): Promise<Response> {
	const code = await store(env).getScript(scriptName);
	if (!code) {
		return new Response(`Worker '${scriptName}' not found`, { status: 404 });
	}

	const worker = env.LOADER.get(scriptName, () => ({
		compatibilityDate: "2025-10-08",
		mainModule: "index.js",
		modules: { "index.js": code },
		globalOutbound: null,
	}));

	return worker.getEntrypoint().fetch(request);
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const pathSegments = url.pathname.split("/").filter(Boolean);

		if (pathSegments.length === 0) {
			return new Response(HTML_UI({ isReadOnly: isReadOnly(env) }), {
				headers: { "Content-Type": "text/html; charset=utf-8" },
			});
		}

		if (pathSegments[0] === "deploy" && request.method === "POST") {
			if (isReadOnly(env)) {
				return Response.json({ error: "Read-only mode enabled" }, { status: 403 });
			}
			try {
				const body = (await request.json()) as {
					scriptName?: string;
					code?: string;
				};
				const scriptName = body.scriptName?.trim() ?? "";
				const code = body.code ?? "";
				if (!scriptName || !code) {
					return Response.json(
						{ error: "Missing scriptName or code" },
						{ status: 400 },
					);
				}
				const result = await deployScript(env, scriptName, code);
				return Response.json(result);
			} catch (error) {
				return Response.json({ error: errorMessage(error) }, { status: 500 });
			}
		}

		try {
			return await runScript(env, pathSegments[0], request);
		} catch (error) {
			return new Response(errorMessage(error) || "Internal error", {
				status: 500,
			});
		}
	},
};
