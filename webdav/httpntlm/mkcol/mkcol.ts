import custommethod from '../custommethod'

export default async function mkcol(options: any): Promise<any> {
	return await custommethod('MKCOL', options)
}
