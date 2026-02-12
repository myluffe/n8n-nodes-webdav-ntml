/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @n8n/community-nodes/no-restricted-imports */
/* eslint-disable @typescript-eslint/no-require-imports */
const ntlm = require('httpntlm').ntlm
const async = require('async')
const httpreq = require('httpreq')
const http = require('http')
const https = require('https')

export default async function custommethod(method: string, options: any): Promise<any> {
	let keepaliveAgent: any
	const isHttps = options.url.trim().toLowerCase().startsWith('https')

	if (isHttps) {
		keepaliveAgent = new https.Agent({ keepAlive: true })
	} else {
		keepaliveAgent = new http.Agent({ keepAlive: true })
	}

	return new Promise((resolve, reject) => {
		async.waterfall(
			[
				function (callback: any) {
					const type1msg = ntlm.createType1Message(options)

					httpreq.get(
						options.url,
						{
							headers: {
								Connection: 'keep-alive',
								Authorization: type1msg,
							},
							agent: keepaliveAgent,
						},
						callback,
					)
				},

				function (res: any, callback: any) {
					//console.log('res1', res)
					if (!res.headers['www-authenticate'])
						return callback(new Error('www-authenticate not found on response of second request'))

					const type2msg = ntlm.parseType2Message(res.headers['www-authenticate'])
					const type3msg = ntlm.createType3Message(type2msg, options)

					let opts = Object.assign({}, options)
					opts = Object.assign(opts, {
						headers: Object.assign(options.headers || {}, {
							Connection: 'Close',
							Authorization: type3msg,
						}),
						method: method,
						allowRedirects: false,
						agent: keepaliveAgent,
					})

					/*setImmediate(function () {
						httpreq.doRequest(opts, callback)
					})*/

					queueMicrotask(() => {
						httpreq.doRequest(opts, callback)
					});
				},
			],
			function (err: any, res: any) {
				if (err) reject(err)

				resolve(res)
			},
		)
	})
}
