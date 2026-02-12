import {
	IconFile,
	ICredentialType,
	INodeProperties,
	Themed,
} from "n8n-workflow"

export class WebDavUserApi implements ICredentialType {
	static CredentialName = 'webDavNTMLApi'
	icon = { light: 'file:../nodes/webdavntlm.svg', dark: 'file:../nodes/webdavntlm.svg' } as Themed<IconFile>;
	name = WebDavUserApi.CredentialName
	displayName = 'WebDav NTML API'

	properties: INodeProperties[] = [
		{
			displayName: 'Server',
			name: 'server',
			type: 'string',
			required: true,
			default: 'http://localhost/webdav',
		},
		{
			displayName: 'User Name',
			name: 'username',
			type: 'string',
			required: true,
			default: '',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			required: true,
			typeOptions: {
				password: true,
			},
			default: '',
		},
		{
			displayName: 'Domain',
			name: 'domain',
			type: 'string',
			required: false,
			default: '',
			description: 'Domain for NTLM Auth',
		},
		{
			displayName: 'NTLM',
			name: 'ntlm',
			type: 'boolean',
			default: true,
			description: 'Use NTLM Auth',
		},
	]

	/*
	// This credential is currently not used by any node directly
	// but the HTTP Request node can use it to make requests.
	// The credential is also testable due to the `test` property below
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			auth: {
				username: '={{ $credentials.username }}',
				password: '={{ $credentials.password }}',
			},
			qs: {
				// Send this as part of the query string
				n8n: 'rocks',
			},
		},
	};

	// The block below tells how this credential can be tested
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials?.server}}',
			url: '',
		},
	};
	*/
}
