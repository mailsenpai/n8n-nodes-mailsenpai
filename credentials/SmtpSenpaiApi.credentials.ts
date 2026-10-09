import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class SmtpSenpaiApi implements ICredentialType {
	name = 'smtpSenpaiApi';

	displayName = 'SMTP Senpai API';

	icon: Icon = { light: 'file:../icons/smtpSenpai.svg', dark: 'file:../icons/smtpSenpai.dark.svg' };

	documentationUrl = 'https://en.mailsenpai.com/smtp-api/';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			placeholder: 'msp_...',
			description:
				'Your SMTP Senpai API key (it starts with msp_). You find it in the customer area, SMTP Senpai page.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://app.mailsenpai.com/relay/v1',
			url: '/stato',
			method: 'GET',
		},
	};
}
