import type {
	DeclarativeRestApiSettings,
	IDataObject,
	IExecutePaginationFunctions,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	IN8nHttpFullResponse,
	INodeExecutionData,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { EVENTS_PAGE_SIZE, MAX_ATTACHMENTS, MAX_RECIPIENTS } from './constants';
import { assertApiSuccess } from './transport';

/* -------------------------------------------------------------------------- */
/*                                 postReceive                                */
/* -------------------------------------------------------------------------- */

/**
 * The API answers { ok: false, errore: "..." } with a 4xx/5xx status. Requests are made with
 * ignoreHttpStatusErrors so that this hook can surface the API's own message.
 */
export async function checkApiResponse(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	assertApiSuccess(this.getNode(), response, this.getItemIndex());
	return items;
}

/* -------------------------------------------------------------------------- */
/*                                   preSend                                  */
/* -------------------------------------------------------------------------- */

interface HeaderEntry {
	name?: string;
	value?: string;
}

interface AttachmentEntry {
	binaryPropertyName?: string;
	fileName?: string;
	mimeType?: string;
}

interface EmailOptions {
	fromName?: string;
	replyTo?: string;
	idempotencyKey?: string;
	headers?: { header?: HeaderEntry[] };
	attachments?: { attachment?: AttachmentEntry[] };
}

export function splitAddresses(value: string): string[] {
	return value
		.split(/[,;]/)
		.map((address) => address.trim())
		.filter((address) => address !== '');
}

/**
 * Builds the JSON body of POST /invio using the English field names of the API.
 */
export async function buildSendEmailRequest(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const node = this.getNode();
	const itemIndex = this.getItemIndex();

	const toRaw = this.getNodeParameter('toEmail', '') as string | string[];
	const to = Array.isArray(toRaw)
		? toRaw.map((address) => String(address).trim()).filter((address) => address !== '')
		: splitAddresses(String(toRaw));
	if (to.length === 0) {
		throw new NodeOperationError(node, 'At least one recipient is required', { itemIndex });
	}
	if (to.length > MAX_RECIPIENTS) {
		throw new NodeOperationError(
			node,
			`Too many recipients: ${to.length} (the API accepts up to ${MAX_RECIPIENTS} per call)`,
			{ itemIndex, description: 'Split the recipients across several items or executions.' },
		);
	}

	const emailFormat = this.getNodeParameter('emailFormat', 'html') as string;
	const body: IDataObject = {
		to,
		from: (this.getNodeParameter('fromEmail', '') as string).trim(),
		subject: this.getNodeParameter('subject', '') as string,
	};

	if (emailFormat === 'text' || emailFormat === 'both') {
		body.text = this.getNodeParameter('text', '') as string;
	}
	if (emailFormat === 'html' || emailFormat === 'both') {
		body.html = this.getNodeParameter('html', '') as string;
	}
	if (!body.text && !body.html) {
		throw new NodeOperationError(node, 'The email has no content', {
			itemIndex,
			description: 'Fill in the Text or the HTML field.',
		});
	}

	const options = this.getNodeParameter('options', {}) as EmailOptions;

	if (options.fromName) body.from_name = options.fromName;
	if (options.replyTo) body.reply_to = options.replyTo.trim();

	const headerEntries = options.headers?.header ?? [];
	if (headerEntries.length) {
		const headers: IDataObject = {};
		for (const entry of headerEntries) {
			const name = (entry.name ?? '').trim();
			if (name === '') continue;
			if (!/^X-[A-Za-z0-9-]{1,40}$/i.test(name)) {
				throw new NodeOperationError(node, `Invalid custom header name: "${name}"`, {
					itemIndex,
					description:
						'Only headers starting with X- are accepted (letters, digits and hyphens, at most 40 characters after X-).',
				});
			}
			headers[name] = entry.value ?? '';
		}
		if (Object.keys(headers).length) body.headers = headers;
	}

	const attachmentEntries = (options.attachments?.attachment ?? []).filter(
		(entry) => (entry.binaryPropertyName ?? '').trim() !== '',
	);
	if (attachmentEntries.length > MAX_ATTACHMENTS) {
		throw new NodeOperationError(
			node,
			`Too many attachments: ${attachmentEntries.length} (the API accepts up to ${MAX_ATTACHMENTS})`,
			{ itemIndex },
		);
	}
	if (attachmentEntries.length) {
		const attachments: IDataObject[] = [];
		for (const entry of attachmentEntries) {
			const propertyName = (entry.binaryPropertyName as string).trim();
			const binaryData = this.helpers.assertBinaryData(propertyName);
			const buffer = await this.helpers.getBinaryDataBuffer(propertyName);
			attachments.push({
				filename: (entry.fileName ?? '').trim() || binaryData.fileName || propertyName,
				content: buffer.toString('base64'),
				content_type:
					(entry.mimeType ?? '').trim() || binaryData.mimeType || 'application/octet-stream',
			});
		}
		body.attachments = attachments;
	}

	requestOptions.body = body;
	requestOptions.json = true;

	const idempotencyKey = (options.idempotencyKey ?? '').trim();
	if (idempotencyKey) {
		if (idempotencyKey.length > 100 || !/^[\x21-\x7E]+$/.test(idempotencyKey)) {
			throw new NodeOperationError(node, 'Invalid idempotency key', {
				itemIndex,
				description: 'Use up to 100 printable ASCII characters, without spaces.',
			});
		}
		requestOptions.headers = {
			...(requestOptions.headers ?? {}),
			'Idempotency-Key': idempotencyKey,
		};
	}

	return requestOptions;
}

interface EventFilters {
	eventType?: string;
	after?: number | string;
}

/**
 * Builds the query string of GET /eventi.
 */
export async function buildEventsQuery(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const returnAll = this.getNodeParameter('returnAll', false) as boolean;
	const limit = this.getNodeParameter('limit', 50) as number;
	const filters = this.getNodeParameter('filters', {}) as EventFilters;

	const qs: IDataObject = { ...((requestOptions.qs as IDataObject) ?? {}) };
	qs.quanti = returnAll ? EVENTS_PAGE_SIZE : limit;
	if (filters.eventType) qs.tipo = filters.eventType;

	const after = filters.after;
	if (after !== undefined && after !== null && String(after) !== '') {
		qs.dopo = Number(after);
	} else if (returnAll) {
		// With a cursor the API returns events oldest first and supports paging.
		qs.dopo = 0;
	}

	requestOptions.qs = qs;
	return requestOptions;
}

/**
 * Pagination for "Return All" on Event > Get Many: follows the event_id cursor.
 */
export async function paginateEvents(
	this: IExecutePaginationFunctions,
	requestData: DeclarativeRestApiSettings.ResultOptions,
): Promise<INodeExecutionData[]> {
	const results: INodeExecutionData[] = [];
	const baseQs = { ...((requestData.options.qs as IDataObject) ?? {}) };
	let cursor = Number(baseQs.dopo ?? 0);

	// Hard stop to avoid an endless loop if the cursor ever stops moving.
	for (let page = 0; page < 10000; page++) {
		const items = await this.makeRoutingRequest({
			...requestData,
			options: {
				...requestData.options,
				qs: { ...baseQs, dopo: cursor, quanti: EVENTS_PAGE_SIZE },
			},
		});
		results.push(...items);

		if (items.length < EVENTS_PAGE_SIZE) break;
		const nextCursor = Number(items[items.length - 1].json.event_id);
		if (!Number.isFinite(nextCursor) || nextCursor <= cursor) break;
		cursor = nextCursor;
	}

	return results;
}
