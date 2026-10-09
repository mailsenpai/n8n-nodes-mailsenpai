# n8n-nodes-mailsenpai

This is an n8n community node package for **SMTP Senpai** (by MailSenpai), a transactional email relay. It lets you send email, read delivery events, manage the suppression list and start workflows when new events arrive.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

- [Installation](#installation)
- [Credentials](#credentials)
- [Operations](#operations)
- [Trigger](#trigger)
- [Compatibility](#compatibility)
- [Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

In short, on a self-hosted n8n instance: **Settings → Community Nodes → Install**, then enter:

```
n8n-nodes-mailsenpai
```

## Credentials

The package adds the **SMTP Senpai API** credential.

1. Sign in to your MailSenpai customer area and open the **SMTP Senpai** page.
2. Copy your API key (it starts with `msp_`).
3. In n8n, create a new **SMTP Senpai API** credential and paste the key in **API Key**.

The key is sent as `Authorization: Bearer <key>` to `https://app.mailsenpai.com/relay/v1`. When you save the credential, n8n checks it with a call to the account status endpoint (`GET /stato`).

## Operations

The **SMTP Senpai** node supports the following resources and operations.

### Email

- **Send**: send an email to one or more recipients.
  - **From Email**: sender address, on a domain verified in your account.
  - **To Email**: one address, or several separated by commas (up to 50 per call, each recipient gets their own copy).
  - **Subject**, **Email Format** (Text, HTML or Both), **Text**, **HTML**.
  - Options:
    - **From Name**: sender display name.
    - **Reply To**: address that receives the replies.
    - **Custom Headers**: extra headers whose names start with `X-`.
    - **Attachments**: files taken from the binary fields of the input item (up to 10 files, 10 MB in total). File name and MIME type come from the binary data unless you override them.
    - **Idempotency Key**: your own key (for example the order ID). If the same request is sent again with the same key within 24 hours, the API returns the first response without sending a second email.

  The output is the API response: for each recipient it reports whether the email was accepted (`inviato`), its message ID (`id_messaggio`) or why it was held (`motivo`, for example a suppressed address), plus the volume left this month (`residuo`).

### Event

- **Get Many**: read the delivery log of the last 90 days.
  - Event types: `sent`, `delivered`, `bounce`, `defer`, `complaint`, `dropped`, `open`, `click` (open and click require tracking on the account).
  - **Return All** or **Limit** (1 to 500).
  - Filters: **Event Type** and **After Event ID** (a cursor: only events newer than that ID are returned, oldest first; without it the latest events are returned, newest first).

### Suppression

- **Add**: stop sending to an address, or to a whole domain (write `@domain.com`), with an optional note.
- **Remove**: remove an entry you added yourself. Entries added because of a bounce or a spam complaint cannot be removed through the API: ask for a review in the customer area.
- **Get Many**: list the suppressed addresses and domains, with an optional search filter.

### Account

- **Get Status**: SMTP settings, monthly volume (included, used, left, hourly pace), tracking status and number of suppressed entries.

Errors returned by the API are shown with the API's own message.

## Trigger

The **SMTP Senpai Trigger** node polls the event log and starts the workflow once for every new event.

- **Event Types**: choose which types start the workflow, or leave it empty to receive all of them.
- On the first activation the node only stores the position of the latest event; events that happened before the activation are not replayed. From then on, every poll returns the events that are newer than the stored position.
- When you click **Test step** (manual run), the node returns the latest events so you can map their fields.

Each output item is one event with these fields: `event_id`, `relay_id`, `type`, `email`, `domain`, `from_domain`, `code`, `reason`, `message_id` (the `id_messaggio` returned by **Email → Send**), `url` (click events only) and `happened_at` (UTC, `YYYY-MM-DD HH:MM:SS`).

## Compatibility

Built and linted with `@n8n/node-cli` 0.51 against `n8n-workflow` 2.x. Requires an n8n version that supports `n8nNodesApiVersion` 1 (n8n 1.x and 2.x).

## Resources

- [SMTP Senpai API documentation](https://en.mailsenpai.com/smtp-api/)
- [SMTP Senpai](https://en.mailsenpai.com/smtp-senpai/)
- [Support](https://en.mailsenpai.com/contact-us/)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)

## License

[MIT](LICENSE.md)
