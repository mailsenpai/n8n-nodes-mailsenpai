import type { INodePropertyOptions } from 'n8n-workflow';

export const BASE_URL = 'https://app.mailsenpai.com/relay/v1';

export const CREDENTIAL_NAME = 'smtpSenpaiApi';

/** Max recipients accepted by POST /invio in one call. */
export const MAX_RECIPIENTS = 50;

/** Max attachments accepted by POST /invio in one call. */
export const MAX_ATTACHMENTS = 10;

/** Max page size of GET /eventi. */
export const EVENTS_PAGE_SIZE = 500;

export const EVENT_TYPE_OPTIONS: INodePropertyOptions[] = [
	{
		name: 'Bounce',
		value: 'bounce',
		description: 'Permanent rejection by the recipient server',
	},
	{
		name: 'Click',
		value: 'click',
		description: 'Link clicked (requires tracking on the account)',
	},
	{
		name: 'Complaint',
		value: 'complaint',
		description: 'Spam report by the recipient',
	},
	{
		name: 'Defer',
		value: 'defer',
		description: 'Temporarily deferred, will be retried',
	},
	{
		name: 'Delivered',
		value: 'delivered',
		description: 'Accepted by the recipient server',
	},
	{
		name: 'Dropped',
		value: 'dropped',
		description: 'Not sent because the recipient is on the suppression list',
	},
	{
		name: 'Open',
		value: 'open',
		description: 'Email opened (requires tracking on the account)',
	},
	{
		name: 'Sent',
		value: 'sent',
		description: 'Accepted for sending via API or form',
	},
];
