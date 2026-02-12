/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import IWebDavClient, { FileInfo } from './IWebDavClient'
import axios, { AxiosHeaders, AxiosInstance, ResponseType } from 'axios'
import WebDavTools from './WebDavTools'

export class WebDavClientBasic implements IWebDavClient {
	private instance: AxiosInstance

	constructor(url: string, user: string, password: string) {
		this.instance = axios.create({
			baseURL: url,
			timeout: 10000,
			auth: {
				username: user,
				password: password,
			},
		})
	}

	async getFile(path: string): Promise<ArrayBuffer> {
		try {
			const response = await this.instance.get(path, {
				responseType: 'arraybuffer' as ResponseType,
			})
			//console.log(response.data)
			return response.data
		} catch (error) {
			throw new Error(`Failed to download file ${path} ${error}`)
		}
	}

	async writeFile(path: string, file: Buffer): Promise<void> {
		try {
			await this.instance.put(path, file, {
				headers: {
					'Content-Type': 'application/octet-stream',
				},
			})
		} catch (error) {
			throw new Error(`Failed to upload file ${path} ${error}`)
		}
	}

	async deleteFile(path: string): Promise<void> {
		try {
			await this.instance.delete(path)
		} catch (error) {
			throw new Error(`Failed to delete file ${path} ${error}`)
		}
	}

	async getFileList(path: string): Promise<FileInfo[]> {
		try {
			const data = await this.instance.request({
				url: path,
				method: 'PROPFIND',
				headers: {
					...WebDavTools.propfindHeaders(),
				} as AxiosHeaders,
				data: WebDavTools.propfindBody(),
			})
			return WebDavTools.parseWebdavFiles(data?.data)
		} catch (error) {
			throw new Error(`Failed to read folder ${path} ${error}`)
		}
	}

	async deleteFolder(path: string): Promise<void> {
		await this.deleteFile(path)
	}

	async createFolder(path: string): Promise<void> {
		try {
			await this.instance.request({
				url: path,
				method: 'MKCOL',
			})
		} catch (error) {
			throw new Error(`Failed to read folder ${path} ${error}`)
		}
	}
}
