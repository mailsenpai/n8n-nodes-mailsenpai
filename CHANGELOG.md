# Changelog

## 0.1.0

- SMTP Senpai API credential (Bearer API key, tested with the account status endpoint).
- SMTP Senpai node: Email → Send (attachments, custom X- headers, idempotency key), Event → Get Many, Suppression → Add / Remove / Get Many, Account → Get Status.
- SMTP Senpai Trigger: polling trigger on the event log with an event_id cursor and an optional event type filter.
