import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';

import { accountDescription } from './resources/account';
import { emailDescription } from './resources/email';
import { eventDescription } from './resources/event';
import { suppressionDescription } from './resources/suppression';
import { BASE_URL } from './shared/constants';

export class SmtpSenpai implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SMTP Senpai',
		name: 'smtpSenpai',
		icon: {
			light: 'file:../../icons/smtpSenpai.svg',
			dark: 'file:../../icons/smtpSenpai.dark.svg',
		},
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Send transactional email, read delivery events and manage the suppression list with SMTP Senpai',
		defaults: {
			name: 'SMTP Senpai',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'smtpSenpaiApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: BASE_URL,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			ignoreHttpStatusErrors: true,
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Account',
						value: 'account',
					},
					{
						name: 'Email',
						value: 'email',
					},
					{
						name: 'Event',
						value: 'event',
					},
					{
						name: 'Suppression',
						value: 'suppression',
					},
				],
				default: 'email',
			},
			...accountDescription,
			...emailDescription,
			...eventDescription,
			...suppressionDescription,
		],
	};
}
