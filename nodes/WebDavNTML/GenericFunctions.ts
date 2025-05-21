import {
	IBinaryData,
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	NodeOperationError,
} from 'n8n-workflow'
import { WebDavUserApi } from '../../credentials/WebDavUserApi.credentials'
import { WebDavClientNTLM } from '../../webdav/WebDavClientNTLM'
import IWebDavClient from '../../webdav/IWebDavClient'
import { FileOperation } from './FileDescription'
import { FolderOperation } from './FolderDescription'
import { WebDavClientBasic } from '../../webdav/WebDavClientBasic'
var mime = require('mime-types')

export async function getWebDavClient(
	func: IExecuteFunctions | ILoadOptionsFunctions,
): Promise<IWebDavClient> {
	// Get credentials
	const credentials = await func.getCredentials(WebDavUserApi.CredentialName)
	if (credentials.ntlm) {
		return new WebDavClientNTLM(
			credentials.server.toString(),
			credentials.username.toString(),
			credentials.password.toString(),
			credentials.domain.toString(),
		)
	} else {
		return new WebDavClientBasic(
			credentials.server.toString(),
			credentials.username.toString(),
			credentials.password.toString(),
		)
	}
}

export async function fileOperationHandle(
	exec: IExecuteFunctions | ILoadOptionsFunctions,
	i: number, //item index
	item: INodeExecutionData,
	client: IWebDavClient,
): Promise<IDataObject> {
	const operation = exec.getNodeParameter('operation', i) as string
	// Get path from input
	const path = exec.getNodeParameter('path', i) as string
	switch (operation) {
		case FileOperation.DOWNLOAD:
			const fileContent = await client.getFile(path)
			const pathParts = path.split('/')
			const fname = pathParts[pathParts.length - 1] || 'file'
			const binary_data = {
				['data']: {
					data: Buffer.from(fileContent).toString('base64'),
					fileName: fname,
					mimeType: mime.lookup(fname),
				} as IBinaryData,
			}
			return {
				json: { message: `File ${path} content is in data field` },
				binary: binary_data,
			} as INodeExecutionData
		case FileOperation.WRITE:
			// Get binary field name from input
			const binaryfield = exec.getNodeParameter('binaryfield', i) as string
			console.log('binary keys:', Object.keys(item.binary || {}))
			const binaryData = item.binary?.[binaryfield]
			if (!binaryData?.data) {
				throw new Error(`Binary data field "${binaryfield}" not found on item ${i}.`)
			}
			const data = binaryData.data
			await client.writeFile(path, Buffer.from(data, 'base64'))
			return {
				message: `File ${path} wrtitten from field ${binaryfield}[${i}]`,
			}
		case FileOperation.DELETE:
			await client.deleteFile(path)
			return { message: `Deleted ${path}` }
		default:
			throw new NodeOperationError(
				exec.getNode(),
				new Error(`Unsupported file operation ${operation}`),
				{ itemIndex: i },
			)
	}
}

export async function folderOperationHandle(
	exec: IExecuteFunctions | ILoadOptionsFunctions,
	i: number, //item index
	client: IWebDavClient,
): Promise<IDataObject[]> {
	// Get path from input
	const path = exec.getNodeParameter('path', i) as string
	const operation = exec.getNodeParameter('operation', i) as string
	switch (operation) {
		case FolderOperation.CREATE:
			await client.createFolder(path)
			return [
				{
					message: `Folder created: ${path}`,
				},
			]
		case FolderOperation.GET:
			const flist = await client.getFileList(path)
			return flist
		case FolderOperation.DELETE:
			await client.deleteFolder(path)
			return [{ message: `Folder deleted ${path}` }]
		default:
			throw new NodeOperationError(
				exec.getNode(),
				new Error(`Unsupported file operation ${operation}`),
				{ itemIndex: i },
			)
	}
}
