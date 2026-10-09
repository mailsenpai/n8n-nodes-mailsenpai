import type { INodeProperties } from 'n8n-workflow';

import { checkApiResponse } from '../../shared/hooks';

const showOnlyForSuppression = {
	resource: ['suppression'],
};

export const suppressionDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForSuppression,
		},
		options: [
			{
				name: 'Add',
				value: 'add',
				action: 'Add an address to the suppression list',
				description: 'Stop sending to an address or a whole domain',
				routing: {
					request: {
						method: 'POST',
						url: '/sopprimi',
					},
					output: {
						postReceive: [checkApiResponse],
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many suppressed addresses',
				description: 'Get the addresses and domains on the suppression list',
				routing: {
					request: {
						method: 'GET',
						url: '/soppressi',
					},
					output: {
						postReceive: [
							checkApiResponse,
							{
								type: 'rootProperty',
								properties: {
									property: 'elenco',
								},
							},
						],
					},
				},
			},
			{
				name: 'Remove',
				value: 'remove',
				action: 'Remove an address from the suppression list',
				description:
					'Remove an entry you added yourself (entries added because of a bounce or a complaint cannot be removed here)',
				routing: {
					request: {
						method: 'POST',
						url: '/riammetti',
					},
					output: {
						postReceive: [checkApiResponse],
					},
				},
			},
		],
		default: 'add',
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'name@example.com',
		description: 'Address to suppress. For a whole domain write @domain.com (or domain.com).',
		displayOptions: {
			show: {
				resource: ['suppression'],
				operation: ['add'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'email',
			},
		},
	},
	{
		displayName: 'Note',
		name: 'note',
		type: 'string',
		default: '',
		description: 'Optional note stored with the entry (up to 255 characters)',
		displayOptions: {
			show: {
				resource: ['suppression'],
				operation: ['add'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'nota',
			},
		},
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'name@example.com',
		description:
			'Entry to remove, written exactly as it appears on the list (domains with the at sign, @domain.com)',
		displayOptions: {
			show: {
				resource: ['suppression'],
				operation: ['remove'],
			},
		},
		routing: {
			send: {
				type: 'body',
				property: 'email',
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: {
			minValue: 1,
			maxValue: 1000,
		},
		default: 50,
		description: 'Max number of results to return',
		displayOptions: {
			show: {
				resource: ['suppression'],
				operation: ['getAll'],
			},
		},
		routing: {
			send: {
				type: 'query',
				property: 'quanti',
			},
		},
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				resource: ['suppression'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Search',
				name: 'search',
				type: 'string',
				default: '',
				placeholder: 'example.com',
				description: 'Return only entries containing this text',
				routing: {
					send: {
						type: 'query',
						property: 'cerca',
					},
				},
			},
		],
	},
];
