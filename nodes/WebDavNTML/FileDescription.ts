import { INodeProperties } from 'n8n-workflow'

export enum FileOperation {
	WRITE = 'write',
	DOWNLOAD = 'download',
	DELETE = 'delete',
}

// When the resource `file` is selected, this `operation` parameter will be shown.
export const fileOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['file'],
			},
		},
		options: [
			{
				name: 'Write',
				value: FileOperation.WRITE,
				description: 'Write a file',
				action: 'Write a file',
			},
			{
				name: 'Download',
				value: FileOperation.DOWNLOAD,
				description: 'Download a file',
				action: 'Download a file',
			},
			{
				name: 'Delete',
				value: FileOperation.DELETE,
				description: 'Delete a file',
				action: 'Delete a file',
			},
		],
		default: FileOperation.DOWNLOAD.toString(),
		noDataExpression: true,
	},
]

// Here we define what to show when the Write Operation is selected.
// We do that by adding `operation: ["write"]` to `displayOptions.show`
const writeOperation: INodeProperties[] = [
	{
		displayName: 'BinaryFieldName',
		name: 'binaryfield',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: [FileOperation.WRITE],
				resource: ['file'],
			},
		},
		default: 'data',
		placeholder: 'Binary data field name',
		description: 'Binary data field name',
	},
]

// Here we define what to show when the Download Operation is selected.
// We do that by adding `operation: ["download"]` to `displayOptions.show`
const downloadOperation: INodeProperties[] = []

// Here we define what to show when the DELETE Operation is selected.
// We do that by adding `operation: ["delete"]` to `displayOptions.show`
const deleteOperation: INodeProperties[] = []

export const fileFields: INodeProperties[] = [
	{
		displayName: 'Path',
		name: 'path',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: [FileOperation.WRITE, FileOperation.DOWNLOAD, FileOperation.DELETE],
				resource: ['file'],
			},
		},
		default: '',
		placeholder: 'path to file in storage',
		description: 'Path to file in storage',
	},

	/* -------------------------------------------------------------------------- */
	/*                                file:write                                */
	/* -------------------------------------------------------------------------- */
	...writeOperation,

	/* -------------------------------------------------------------------------- */
	/*                              file:download                               */
	/* -------------------------------------------------------------------------- */
	...downloadOperation,

	/* -------------------------------------------------------------------------- */
	/*                              file:delete                               */
	/* -------------------------------------------------------------------------- */
	...deleteOperation,
]
