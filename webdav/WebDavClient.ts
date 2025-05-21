import IWebDavClient, { FileInfo } from './IWebDavClient'
import httpntlm from 'httpntlm'
import propfind from './httpntlm/propfind/propfind'
import { parseStringPromise } from 'xml2js'
import mkcol from './httpntlm/mkcol/mkcol'

export class WebDavClient implements IWebDavClient {
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
		return encodeURI(`${this.options.url}${path.startsWith('/') ? path : '/' + path}`)
	}

	getFile(path: string): Promise<ArrayBuffer> {
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
						throw Error(`Get file opration failed with status ${res?.statusCode}`)
					}
					resolve(res?.body || '')
				}
			})
		})
	}

	writeFile(path: string, file: Buffer): Promise<void> {
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
						throw Error(`File creation failed with status ${res?.statusCode}`)
					}
					resolve()
				}
			})
		})
	}

	deleteFile(path: string): Promise<void> {
		const options = {
			...this.options,
			url: this.getUrl(path),
		}
		return new Promise((resolve, reject) => {
			httpntlm.method('delete', options, (err: any, res: any) => {
				if (err) reject(err)
				else {
					if (res?.statusCode > 299 || res?.statusCode < 200) {
						throw Error(`Delete file opration failed with status ${res?.statusCode}`)
					}
					resolve(res?.body || '')
				}
			})
		})
	}

	deleteFolder(path: string): Promise<void> {
		return this.deleteFile(path)
	}

	private parseFiles(respData: Record<string, unknown>): FileInfo[] {
		const data = (respData['D:multistatus'] as Record<string, unknown>)['D:response'] as Record<
			string,
			unknown
		>[]
		const result: FileInfo[] = []

		for (const it of data) {
			try {
				const props = (
					(it['D:propstat'] as Record<string, unknown>[])[0]['D:prop'] as Record<string, unknown>[]
				)[0]
				result.push({
					url: decodeURI((it['D:href'] as unknown[])[0] as string),
					name: (props['D:displayname'] as unknown[])[0] as string,
					type: (props['D:getcontenttype'] as unknown[])[0] as string,
					created: (props['D:creationdate'] as unknown[])[0] as string,
					updated: new Date(
						Date.parse((props['D:getlastmodified'] as unknown[])[0] as string),
					).toISOString(),
					isDir: (props['D:iscollection'] as unknown[])[0] == '1',
				})
			} catch (e) {
				console.error(`Parse file list item error: ${e}`)
			}
		}
		return result
	}

	async getFileList(path: string): Promise<FileInfo[]> {
		const options = {
			...this.options,
			url: this.getUrl(path),
			headers: Object.assign(this.options.headers || {}, {
				Depth: '1', // или 0 / infinity
				'Content-Type': 'text/xml',
			}),
			body: `
                <?xml version="1.0" encoding="utf-8" ?>
                <D:propfind xmlns:D="DAV:">
                    <D:allprop/>
                </D:propfind>
            `.trim(),
		}
		const data = await propfind(options)

		if (data?.statusCode > 299 || data?.statusCode < 200) {
			throw Error(`Get files failed with status ${data?.statusCode}`)
		}
		const xmlparsed = await parseStringPromise(data.body)
		return this.parseFiles(xmlparsed)
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

//const fileExample =
//	'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IS0tIFVwbG9hZGVkIHRvOiBTVkcgUmVwbywgd3d3LnN2Z3JlcG8uY29tLCBHZW5lcmF0b3I6IFNWRyBSZXBvIE1peGVyIFRvb2xzIC0tPgo8c3ZnIGZpbGw9IiM1ZjYzNjgiIHdpZHRoPSI4MDBweCIgaGVpZ2h0PSI4MDBweCIgdmlld0JveD0iMCAwIDE0IDE0IiByb2xlPSJpbWciIGZvY3VzYWJsZT0iZmFsc2UiIGFyaWEtaGlkZGVuPSJ0cnVlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Im0gMTIuOTk5OTkyLDIuODY2MzMxIDAsOC4yNzM4MzkgYyAwLDAuMDcwNSAtMC4wMjUsMC4xMjc1MDUgLTAuMDc0NSwwLjE3MzAwNyAtMC4wNTA1LDAuMDQ3IC0wLjExMDUwNSwwLjA2OSAtMC4xODAwMDgsMC4wNjkgbCAtNC4yNzk2NzUxLDAgMCwtMS4xNDc1NDcgMy40OTExNDMxLDAgMCwtMC41MjI1MjIgLTMuNDk0MTQzMiwwIDAsLTAuNjM5NTI2IDMuNDkxMTQzMiwwIDAsLTAuNTIyMDIxIC0zLjQ4ODY0MzEsMCAwLC0wLjY0NTAyNyAzLjQ5MDE0MzEsMCAwLC0wLjUxNjAyMSAtMy40OTAxNDMxLDAgMCwtMC42NDY1MjYgMy40OTAxNDMxLDAgMCwtMC41MjIwMjIgLTMuNDkwMTQzMSwwIDAsLTAuNjM5NTI2IDMuNDkwMTQzMSwwIDAsLTAuNTIxNTIxIC0zLjQ5MDE0MzEsMCAwLC0wLjY1MjUyNyAzLjQ5MDE0MzEsMCAwLC0wLjQ5NzAyMSAtMy40OTAxNDMxLDAgMCwtMS4yOTY1NTMgNC4yODExNzUxLDAgYyAwLjA3NDUsMCAwLjEzNTAwNiwwLjAyNCAwLjE3OTAwOCwwLjA3NDUgMC4wNTI1LDAuMDQ5NSAwLjA3NSwwLjExMDAwNSAwLjA3NDUsMC4xNzgwMDggeiBtIC01LjE3NDcxMjMsLTEuNTQ2MDY0IDAsMTEuMzYxNDY2IC02LjgyNTI3OTc3LC0xLjE4MTA0OCAwLC04Ljk2NzM2OCA2LjgyNTI3OTc3LC0xLjIxNTA1IDAsMC4wMDIgeiBtIC0xLjAzMDA0MjMsMy4zNTQxMzggLTAuODU0NTM1LDAuMDUyNSAtMC41NDgwMjI1LDMuMzkyNjM5IC0wLjAxMjUwMSwwIEMgNS4zNTMxNzgzLDcuOTU5MDM5IDUuMjUyNjc0Miw3LjM5NzAxNiA1LjA3MjY2NjgsNi40MzU5NzcgTCA0Ljc1MzE1MzcsNC44MDQ0MSAzLjk1MTEyMDksNC44NDQ0MSAzLjYzMDEwNzcsNi40MzU5NzUgQyAzLjQ0MjYsNy4zNjMwMTMgMy4zMzgwOTU3LDcuOTAyNTM1IDMuMzEwNTk0Niw4LjA1NDA0MSBsIC0wLjAwNzUsMCAtMC40ODc1MiwtMy4xMjUxMjggLTAuNzM1MDMwMSwwLjAzOSAwLjc4NzUzMjMsMy45NDE2NjEgMC44MTcwMzM1LDAuMDUyNSAwLjMwNzUxMjYsLTEuNTM0MDYzIEMgNC4xNzI2Mjk5LDYuNTI3OTgxIDQuMjc3NjM0Miw2LjAwNDk1OSA0LjMwMDEzNTIsNS44NjE5NTMgbCAwLjAyMjUwMSwwIGMgMC4wMzA1MDEsMC4xNTI1MDcgMC4xMjgwMDUyLDAuNjg3MDI5IDAuMzA3NTEyNiwxLjYwNTA2NiBsIDAuMzA3NTEyNiwxLjU3OTA2NSAwLjg4NTAzNjMsMC4wNTI1IDAuOTkwMDQwNiwtNC40MjUxODEgLTAuMDE3NTAxLDAgeiIvPjwvc3ZnPg=='

/*
async function testWebDav() {
	console.log(
		'-----------------------------------------------------------------------------------------',
	)pnpm link --global
	const client = new WebDavClient('https://storage.k2consult.ru/', 'alexey.gusev', '', 'K2')
	//await client.createFolder('/Common/Medvedev/test')
	//const fileData = Buffer.from(fileExample, 'base64')
	//await client.writeFile('/Common/Medvedev/word.svg', fileData)
	//await client.deleteFile('/Common/Medvedev/word.svg')
	//await client.deleteFolder('/Common/Medvedev/test')

	//const flist = await client.getFileList('Common')
	//console.log('flist', flist)

	//const file = await client.getFile('/Common/Новый текстовый документ.txt')
	//const file = await client.getFile(
	//'/Support/Infrastructure/Schedule Infra/Schedule_workdays_Infra_2025.xlsx',
	//)
	//console.log('file', file)
}
testWebDav()
*/
