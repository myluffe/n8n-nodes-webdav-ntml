import { INodeProperties } from 'n8n-workflow'

export enum FolderOperation {
	CREATE = 'create',
	GET = 'get',
	DELETE = 'delete',
}

// When the resource `file` is selected, this `operation` parameter will be shown.
export const folderOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['folder'],
			},
		},
		options: [
			{
				name: 'Create',
				value: FolderOperation.CREATE,
				description: 'Create a folder',
				action: 'Create a folder',
			},
			{
				name: 'Get',
				value: FolderOperation.GET,
				description: 'Get files and subfolders list in folder',
				action: 'Get a folder',
			},
			{
				name: 'Delete',
				value: FolderOperation.DELETE,
				description: 'Delete a folder',
				action: 'Delete a folder',
			},
		],
		default: FolderOperation.GET.toString(),
		noDataExpression: true,
	},
]

const createOperation: INodeProperties[] = []

const getOperation: INodeProperties[] = []

const deleteOperation: INodeProperties[] = []

export const folderFields: INodeProperties[] = [
	{
		displayName: 'Path',
		name: 'path',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: [FolderOperation.GET, FolderOperation.CREATE, FolderOperation.DELETE],
				resource: ['folder'],
			},
		},
		default: '',
		placeholder: 'path to folder in storage',
		description: 'Path to folder in storage',
	},

	/* -------------------------------------------------------------------------- */
	/*                                folder:create                                */
	/* -------------------------------------------------------------------------- */
	...createOperation,

	/* -------------------------------------------------------------------------- */
	/*                              folder:get                               */
	/* -------------------------------------------------------------------------- */
	...getOperation,

	/* -------------------------------------------------------------------------- */
	/*                              folder:delete                               */
	/* -------------------------------------------------------------------------- */
	...deleteOperation,
]
