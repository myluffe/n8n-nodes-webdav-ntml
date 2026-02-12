/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import IWebDavClient, { FileInfo } from './IWebDavClient'
import httpntlm from 'httpntlm'
import propfind from './httpntlm/propfind/propfind'
import mkcol from './httpntlm/mkcol/mkcol'
import WebDavTools from './WebDavTools'

export class WebDavClientNTLM implements IWebDavClient {
	private options: httpntlm.NtlmOptions

	constructor(url: string, user: string, password: string, domain: string) {
		this.options = {
			url: url.endsWith('/') ? url.slice(0, url.length - 1) : url,
			username: user,
			password: password,
			domain: domain,
		}
	}

	private getUrl(path: string) {
		return WebDavTools.getUrl(this.options.url, path)
	}

	async getFile(path: string): Promise<ArrayBuffer> {
		const options = {
			...this.options,
			url: this.getUrl(path),
			binary: true,
		}
		return new Promise((resolve, reject) => {
			httpntlm.get(options, (err: any, res: any) => {
				if (err) reject(err)
				else {
					if (res?.statusCode > 299 || res?.statusCode < 200) {
						reject(new Error(`Get file opration failed with status ${res?.statusCode}`))
					}
					resolve(res?.body || '')
				}
			})
		})
	}

	async writeFile(path: string, file: Buffer): Promise<void> {
		const options = {
			...this.options,
			url: this.getUrl(path),
			headers: {
				'Content-Type': 'application/octet-stream',
			},
			body: file,
		}
		return new Promise((resolve, reject) => {
			httpntlm.put(options, (err: any, res: any) => {
				if (err) reject(err)
				else {
					if (res?.statusCode > 299 || res?.statusCode < 200) {
						reject(new Error(`File creation failed with status ${res?.statusCode}`))
					}
					resolve()
				}
			})
		})
	}

	async deleteFile(path: string): Promise<void> {
		const options = {
			...this.options,
			url: this.getUrl(path),
		}
		return new Promise((resolve, reject) => {
			httpntlm.method('delete', options, (err: any, res: any) => {
				if (err) reject(err)
				else {
					if (res?.statusCode > 299 || res?.statusCode < 200) {
						reject(new Error(`Delete file opration failed with status ${res?.statusCode}`))
					}
					resolve(res?.body || '')
				}
			})
		})
	}

	async deleteFolder(path: string): Promise<void> {
		return this.deleteFile(path)
	}

	async getFileList(path: string): Promise<FileInfo[]> {
		const options = {
			...this.options,
			url: this.getUrl(path),
			headers: Object.assign(this.options.headers || {}, WebDavTools.propfindHeaders()),
			body: WebDavTools.propfindBody(),
		}
		const data = await propfind(options)

		if (data?.statusCode > 299 || data?.statusCode < 200) {
			throw Error(`Get files failed with status ${data?.statusCode}`)
		}
		return WebDavTools.parseWebdavFiles(data.body)
	}

	async createFolder(path: string): Promise<void> {
		const options = {
			...this.options,
			url: this.getUrl(path),
		}
		//console.log('options', options)
		const data = await mkcol(options)
		if (data?.statusCode > 299 || data?.statusCode < 200) {
			throw Error(`Create folder failed with status ${data?.statusCode}`)
		}
		return
	}
}
