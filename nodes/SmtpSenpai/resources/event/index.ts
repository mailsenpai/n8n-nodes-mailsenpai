import type { INodeProperties } from 'n8n-workflow';

import { EVENT_TYPE_OPTIONS } from '../../shared/constants';
import { buildEventsQuery, checkApiResponse, paginateEvents } from '../../shared/hooks';

const showOnlyForEvent = {
	resource: ['event'],
};

const showOnlyForEventGetMany = {
	resource: ['event'],
	operation: ['getAll'],
};

export const eventDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForEvent,
		},
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many events',
				description:
					'Get delivery events (sent, delivered, bounce, defer, complaint, dropped, open, click) from the last 90 days',
				routing: {
					request: {
						method: 'GET',
						url: '/eventi',
					},
					send: {
						preSend: [buildEventsQuery],
					},
					output: {
						postReceive: [
							checkApiResponse,
							{
								type: 'rootProperty',
								properties: {
									property: 'eventi',
								},
							},
						],
					},
				},
			},
		],
		default: 'getAll',
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: {
			show: showOnlyForEventGetMany,
		},
		routing: {
			send: {
				paginate: '={{ $value }}',
			},
			operations: {
				pagination: paginateEvents,
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: {
			minValue: 1,
			maxValue: 500,
		},
		default: 50,
		description: 'Max number of results to return',
		displayOptions: {
			show: {
				...showOnlyForEventGetMany,
				returnAll: [false],
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
			show: showOnlyForEventGetMany,
		},
		options: [
			{
				displayName: 'After Event ID',
				name: 'after',
				type: 'number',
				typeOptions: {
					minValue: 0,
				},
				default: 0,
				description:
					'Cursor: the event_id of the last event you already read. Only newer events are returned, oldest first. Without it the latest events are returned, newest first.',
			},
			{
				displayName: 'Event Type',
				name: 'eventType',
				type: 'options',
				options: EVENT_TYPE_OPTIONS,
				default: 'delivered',
				description: 'Return only events of this type',
			},
		],
	},
];
