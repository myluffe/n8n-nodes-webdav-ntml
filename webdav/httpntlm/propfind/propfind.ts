/* eslint-disable @typescript-eslint/no-explicit-any */
import custommethod from '../custommethod'

export default async function propfind(options: any): Promise<any> {
	return await custommethod('PROPFIND', options)
}
