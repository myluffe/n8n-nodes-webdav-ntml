/* eslint-disable n8n-nodes-base/node-filename-against-convention */
import {
	//IBinaryData,
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	//NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow'
import { fileFields, fileOperations } from './FileDescription'
import { WebDavUserApi } from '../../credentials/WebDavUserApi.credentials'
import { fileOperationHandle, folderOperationHandle, getWebDavClient } from './GenericFunctions'
import { folderFields, folderOperations } from './FolderDescription'

/*
import {
	OptionsWithUri,
} from 'request';
*/

export enum WebDavResource {
	FILE = 'file',
	FOLDER = 'folder',
}

export class WebDavNTML implements INodeType {
	description: INodeTypeDescription = {
		// Basic node details will go here
		properties: [
			// Resources and operations will go here
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				options: [
					{
						name: 'File',
						value: WebDavResource.FILE,
					},
					{
						name: 'Folder',
						value: WebDavResource.FOLDER,
					},
				],
				default: WebDavResource.FILE.toString(),
				noDataExpression: true,
				required: true,
			},
			...fileOperations,
			...fileFields,
			...folderOperations,
			...folderFields,
		],
		displayName: 'WebDavNTML',
		name: 'webDavNtml',
		icon: 'file:webdavntlm.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
		description: 'Interact with WebDav with NTML auth',
		defaults: {
			name: 'WebDav',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: WebDavUserApi.CredentialName,
				required: true,
			},
		],
	}
	// The execute method will go here
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		// Handle data coming from previous nodes
		const items = this.getInputData()
		const returnData: IDataObject[] = []

		// Get credentials
		const client = await getWebDavClient(this)

		//await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName)
		// For each item, make an action
		for (let i = 0; i < items.length; i++) {
			const resource = this.getNodeParameter('resource', i) as string
			//const operation = this.getNodeParameter('operation', i) as string
			switch (resource) {
				case WebDavResource.FILE:
					returnData.push(await fileOperationHandle(this, i, items[i], client))
					break
				case WebDavResource.FOLDER:
					const data = await folderOperationHandle(this, i, client)
					data.forEach((it) => returnData.push(it))
					break
				default:
					throw new NodeOperationError(
						this.getNode(),
						new Error(`Unsopperted resource ${resource}`),
						{ itemIndex: i },
					)
			}
		}

		// Map data to n8n data structure
		return [this.helpers.returnJsonArray(returnData)]
	}
}
