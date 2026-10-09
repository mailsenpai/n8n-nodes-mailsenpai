import type {
	IDataObject,
	IExecuteFunctions,
	IExecuteSingleFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	IN8nHttpFullResponse,
	INode,
	IPollFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

import { BASE_URL, CREDENTIAL_NAME } from './constants';

/**
 * Turns an SMTP Senpai error response ({ ok: false, errore: "..." }) into a NodeApiError
 * that shows the API's own message. Returns silently when the response is a success.
 */
export function assertApiSuccess(
	node: INode,
	response: Pick<IN8nHttpFullResponse, 'statusCode' | 'body'>,
	itemIndex?: number,
): void {
	const statusCode = response.statusCode ?? 200;
	const body = (response.body ?? {}) as IDataObject;
	const failed = statusCode >= 400 || (typeof body === 'object' && body.ok === false);
	if (!failed) return;

	const apiMessage =
		typeof body === 'object' && typeof body.errore === 'string' && body.errore !== ''
			? body.errore
			: `SMTP Senpai API returned HTTP ${statusCode}`;

	const extra: string[] = [];
	if (typeof body === 'object') {
		if (typeof body.aumenta === 'string') extra.push(`Raise your plan: ${body.aumenta}`);
		if (typeof body.pannello === 'string') extra.push(`Usage panel: ${body.pannello}`);
	}

	throw new NodeApiError(node, (typeof body === 'object' ? body : { body }) as JsonObject, {
		message: apiMessage,
		description: extra.length ? extra.join(' · ') : undefined,
		httpCode: String(statusCode),
		itemIndex,
	});
}

/**
 * Programmatic request helper (used by the trigger node).
 */
export async function smtpSenpaiApiRequest(
	this: IPollFunctions | IExecuteFunctions | IExecuteSingleFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	qs: IDataObject = {},
	body?: IDataObject,
): Promise<IDataObject> {
	const options: IHttpRequestOptions = {
		method,
		url: `${BASE_URL}${endpoint}`,
		qs,
		json: true,
		returnFullResponse: true,
		ignoreHttpStatusErrors: true,
		headers: { Accept: 'application/json' },
	};
	if (body !== undefined) options.body = body;

	const response = (await this.helpers.httpRequestWithAuthentication.call(
		this,
		CREDENTIAL_NAME,
		options,
	)) as IN8nHttpFullResponse;

	assertApiSuccess(this.getNode(), response);
	return (response.body ?? {}) as IDataObject;
}
