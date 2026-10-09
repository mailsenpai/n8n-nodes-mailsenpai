import {
	NodeConnectionTypes,
	NodeOperationError,
	type IDataObject,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	type IPollFunctions,
} from 'n8n-workflow';

import { EVENT_TYPE_OPTIONS, EVENTS_PAGE_SIZE } from '../SmtpSenpai/shared/constants';
import { smtpSenpaiApiRequest } from '../SmtpSenpai/shared/transport';

/** Max pages read in one poll (500 events each); the rest is picked up at the next poll. */
const MAX_PAGES_PER_POLL = 20;

/** Events returned when the node is run manually (test step). */
const MANUAL_SAMPLE_SIZE = 20;

interface StaticData {
	lastEventId?: string;
}

function toEventList(response: IDataObject): IDataObject[] {
	return Array.isArray(response.eventi) ? (response.eventi as IDataObject[]) : [];
}

export class SmtpSenpaiTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SMTP Senpai Trigger',
		name: 'smtpSenpaiTrigger',
		icon: {
			light: 'file:../../icons/smtpSenpai.svg',
			dark: 'file:../../icons/smtpSenpai.dark.svg',
		},
		group: ['trigger'],
		version: 1,
		subtitle:
			'={{ ($parameter["events"] || []).length ? $parameter["events"].join(", ") : "All events" }}',
		description:
			'Starts the workflow when new SMTP Senpai events appear (delivered, bounce, complaint and more)',
		defaults: {
			name: 'SMTP Senpai Trigger',
		},
		polling: true,
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'smtpSenpaiApi',
				required: true,
			},
		],
		properties: [
			{
				displayName:
					'On the first activation only the position in the event log is saved: from then on each new event starts the workflow once. Events older than the activation are not replayed.',
				name: 'notice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'Event Types',
				name: 'events',
				type: 'multiOptions',
				options: EVENT_TYPE_OPTIONS,
				default: [],
				description:
					'Event types that start the workflow. Leave empty to receive every type. Open and click need tracking active on the account.',
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const staticData = this.getWorkflowStaticData('node') as StaticData;
		const eventTypes = this.getNodeParameter('events', []) as string[];
		const matches = (event: IDataObject) =>
			eventTypes.length === 0 || eventTypes.includes(String(event.type));

		// Manual run (test step): return the latest events so the user can map the fields.
		if (this.getMode() === 'manual') {
			const qs: IDataObject = { quanti: MANUAL_SAMPLE_SIZE };
			if (eventTypes.length === 1) qs.tipo = eventTypes[0];
			const events = toEventList(
				await smtpSenpaiApiRequest.call(this, 'GET', '/eventi', qs),
			).filter(matches);
			if (events.length === 0) {
				throw new NodeOperationError(this.getNode(), 'No events found', {
					description:
						'There are no recent events of the selected types. Send an email first, or widen the Event Types filter.',
				});
			}
			return [this.helpers.returnJsonArray(events)];
		}

		// First automatic run: remember where the log is now, without emitting the history.
		if (staticData.lastEventId === undefined) {
			const latest = toEventList(
				await smtpSenpaiApiRequest.call(this, 'GET', '/eventi', { quanti: 1 }),
			);
			staticData.lastEventId = latest.length ? String(latest[0].event_id) : '0';
			return null;
		}

		let cursor = Number(staticData.lastEventId) || 0;
		const collected: IDataObject[] = [];

		for (let page = 0; page < MAX_PAGES_PER_POLL; page++) {
			const response = await smtpSenpaiApiRequest.call(this, 'GET', '/eventi', {
				dopo: cursor,
				quanti: EVENTS_PAGE_SIZE,
			});
			const events = toEventList(response);
			if (events.length === 0) break;

			collected.push(...events.filter(matches));

			const lastId = Number(events[events.length - 1].event_id);
			const next = Number(response.prossimo);
			const nextCursor = Number.isFinite(next) && next > cursor ? next : lastId;
			if (!Number.isFinite(nextCursor) || nextCursor <= cursor) break;
			cursor = nextCursor;

			if (response.altri !== true) break;
		}

		staticData.lastEventId = String(cursor);

		if (collected.length === 0) return null;
		return [this.helpers.returnJsonArray(collected)];
	}
}
