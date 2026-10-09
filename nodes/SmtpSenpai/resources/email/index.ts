import type { INodeProperties } from 'n8n-workflow';

import { buildSendEmailRequest, checkApiResponse } from '../../shared/hooks';

const showOnlyForEmail = {
	resource: ['email'],
};

const showOnlyForEmailSend = {
	resource: ['email'],
	operation: ['send'],
};

export const emailDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForEmail,
		},
		options: [
			{
				name: 'Send',
				value: 'send',
				action: 'Send an email',
				description: 'Send a transactional email to one or more recipients',
				routing: {
					request: {
						method: 'POST',
						url: '/invio',
					},
					send: {
						preSend: [buildSendEmailRequest],
					},
					output: {
						postReceive: [checkApiResponse],
					},
				},
			},
		],
		default: 'send',
	},
	{
		displayName: 'From Email',
		name: 'fromEmail',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'orders@yourdomain.com',
		description:
			'Sender address. It must be on a domain verified in your SMTP Senpai account (subdomains are accepted).',
		displayOptions: {
			show: showOnlyForEmailSend,
		},
	},
	{
		displayName: 'To Email',
		name: 'toEmail',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'customer@example.com',
		description:
			'Recipient address. Separate several addresses with commas: up to 50, each one gets their own copy.',
		displayOptions: {
			show: showOnlyForEmailSend,
		},
	},
	{
		displayName: 'Subject',
		name: 'subject',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Your order is confirmed',
		displayOptions: {
			show: showOnlyForEmailSend,
		},
	},
	{
		displayName: 'Email Format',
		name: 'emailFormat',
		type: 'options',
		options: [
			{
				name: 'Text',
				value: 'text',
				description: 'Send the email as plain text',
			},
			{
				name: 'HTML',
				value: 'html',
				description: 'Send the email as HTML (the text part is derived from it)',
			},
			{
				name: 'Both',
				value: 'both',
				description: 'Send both a text and an HTML version',
			},
		],
		default: 'html',
		displayOptions: {
			show: showOnlyForEmailSend,
		},
	},
	{
		displayName: 'Text',
		name: 'text',
		type: 'string',
		typeOptions: {
			rows: 5,
		},
		default: '',
		description: 'Plain-text body of the email',
		displayOptions: {
			show: {
				...showOnlyForEmailSend,
				emailFormat: ['text', 'both'],
			},
		},
	},
	{
		displayName: 'HTML',
		name: 'html',
		type: 'string',
		typeOptions: {
			rows: 5,
		},
		default: '',
		description: 'HTML body of the email',
		displayOptions: {
			show: {
				...showOnlyForEmailSend,
				emailFormat: ['html', 'both'],
			},
		},
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		displayOptions: {
			show: showOnlyForEmailSend,
		},
		options: [
			{
				displayName: 'Attachments',
				name: 'attachments',
				type: 'fixedCollection',
				placeholder: 'Add Attachment',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				description:
					'Files to attach, taken from the binary data of the input item (up to 10 files and 10 MB in total)',
				options: [
					{
						displayName: 'Attachment',
						name: 'attachment',
						values: [
							{
								displayName: 'Input Binary Field',
								name: 'binaryPropertyName',
								type: 'string',
								default: 'data',
								required: true,
								hint: 'The name of the input binary field containing the file to attach',
							},
							{
								displayName: 'File Name',
								name: 'fileName',
								type: 'string',
								default: '',
								placeholder: 'invoice.pdf',
								description:
									'Name of the attached file. Leave empty to use the file name of the binary data.',
							},
							{
								displayName: 'MIME Type',
								name: 'mimeType',
								type: 'string',
								default: '',
								placeholder: 'application/pdf',
								description:
									'MIME type of the attached file. Leave empty to use the MIME type of the binary data.',
							},
						],
					},
				],
			},
			{
				displayName: 'Custom Headers',
				name: 'headers',
				type: 'fixedCollection',
				placeholder: 'Add Header',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				description: 'Extra email headers. Only names starting with X- are accepted.',
				options: [
					{
						displayName: 'Header',
						name: 'header',
						values: [
							{
								displayName: 'Name',
								name: 'name',
								type: 'string',
								default: '',
								placeholder: 'X-Order-ID',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
							},
						],
					},
				],
			},
			{
				displayName: 'From Name',
				name: 'fromName',
				type: 'string',
				default: '',
				placeholder: 'Your Shop',
				description: 'Sender display name',
			},
			{
				displayName: 'Idempotency Key',
				name: 'idempotencyKey',
				type: 'string',
				default: '',
				placeholder: 'order-10293',
				description:
					'Your own key (for example the order ID), valid for 24 hours: the same request sent again with this key returns the first response without sending a second email',
			},
			{
				displayName: 'Reply To',
				name: 'replyTo',
				type: 'string',
				default: '',
				placeholder: 'support@yourdomain.com',
				description: 'Address that receives the replies',
			},
		],
	},
];
