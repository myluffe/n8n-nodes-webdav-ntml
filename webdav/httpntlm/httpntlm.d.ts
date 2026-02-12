/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'httpntlm' {
	interface NtlmOptions {
		url: string
		username: string
		password: string
		domain: string
		workstation?: string
		headers?: Record<string, string>
		body?: any
	}

	type Callback = (err: Error | null, res: any) => void

	export function get(options: NtlmOptions, callback: Callback): void
	export function post(options: NtlmOptions, callback: Callback): void
	export function put(options: NtlmOptions, callback: Callback): void
	export function method(method: string, options: NtlmOptions, callback: Callback): void
}
