/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { parseStringPromise } from 'xml2js'
import { FileInfo } from './IWebDavClient'

export default class WebDavTools {
	private constructor() {}

	static getUrl(server: string, path: string) {
		const pathDecoded = decodeURIComponent(path)
		return encodeURI(`${server}${pathDecoded.startsWith('/') ? pathDecoded : '/' + pathDecoded}`)
	}

	static propfindHeaders(): Record<string, unknown> {
		return {
			Depth: '1', // or 0 / infinity
			'Content-Type': 'text/xml',
		}
	}

	static propfindBody(): string {
		return `
			<?xml version="1.0" encoding="utf-8" ?>
			<D:propfind xmlns:D="DAV:">
				<D:allprop/>
			</D:propfind>
		`.trim()
	}

	static async parseWebdavFiles(webdavXmlResponse: string) {
		const xmlparsed = await parseStringPromise(webdavXmlResponse)
		return WebDavTools._parseWebdavFiles(xmlparsed)
	}

	private static XMLObjectRemoveNameSpace(data: any) {
		const result: any = {}
		for (const key of Object.keys(data)) {
			const keyParts = key.split(':')
			const newKey = keyParts[keyParts.length - 1]
			result[newKey] =
				typeof data[key] == 'object' ? WebDavTools.XMLObjectRemoveNameSpace(data[key]) : data[key]
		}
		return result
	}

	private static _parseWebdavFiles(parsedXmlData: Record<string, unknown>): FileInfo[] {
		const respData = WebDavTools.XMLObjectRemoveNameSpace(parsedXmlData)
		//console.log('respData', JSON.stringify(respData))

		const data = (respData['multistatus'] as Record<string, unknown>)['response'] as Record<
			string,
			unknown
		>[]
		//console.log('data', JSON.stringify(data))
		const result: FileInfo[] = []

		for (const it of Object.values(data)) {
			try {
				const props = (
					(it['propstat'] as Record<string, unknown>[])[0]['prop'] as Record<string, unknown>[]
				)[0]
				//console.log('props', props)
				const url = decodeURI(((it['href'] || ['']) as unknown[])[0] as string)
				const nameParts = url.split('/').filter((it) => it.trim().length > 0)
				const name = nameParts[nameParts.length - 1]
				result.push({
					url: url,
					name: ((props['displayname'] || [name]) as unknown[])[0] as string,
					type: ((props['getcontenttype'] || ['']) as unknown[])[0] as string,
					created: ((props['creationdate'] || ['']) as unknown[])[0] as string,
					updated: new Date(
						Date.parse(((props['getlastmodified'] || ['1970-01-01']) as unknown[])[0] as string),
					).toISOString(),
					isDir:
						((props['iscollection'] || [name.includes('.') ? '1' : '0']) as unknown[])[0] == '1',
				})
			} catch (e) {
				// eslint-disable-next-line no-console
				console.error(`Parse file list item ${JSON.stringify(it || {})} error: ${e}`)
			}
		}
		return result
	}
}
