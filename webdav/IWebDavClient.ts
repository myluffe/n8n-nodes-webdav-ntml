export type FileInfo = {
	name: string
	url: string
	type: string
	created: string
	updated: string
	isDir: boolean
}

export default interface IWebDavClient {
	getFile(path: string): Promise<ArrayBuffer>
	writeFile(path: string, file: Buffer): Promise<void>
	deleteFile(path: string): Promise<void>
	getFileList(path: string): Promise<FileInfo[]>
	deleteFolder(path: string): Promise<void>
	createFolder(path: string): Promise<void>
}
