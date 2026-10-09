import type { INodeProperties } from 'n8n-workflow';

import { checkApiResponse } from '../../shared/hooks';

export const accountDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['account'],
			},
		},
		options: [
			{
				name: 'Get Status',
				value: 'getStatus',
				action: 'Get the account status',
				description:
					'Get the SMTP settings, the monthly volume (included, used, left), tracking and suppression count',
				routing: {
					request: {
						method: 'GET',
						url: '/stato',
					},
					output: {
						postReceive: [checkApiResponse],
					},
				},
			},
		],
		default: 'getStatus',
	},
];
