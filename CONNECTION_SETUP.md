# HTTP and SMPP connections

## Demo use
Open Providers & Gateways, open **Demo Carrier — HTTP & SMPP**, then Edit Demo HTTP or Edit Demo SMPP. Both start in DEMO mode. Test saved connection runs a local simulation. Simulate sample SMS returns SIMULATED: no network SMS, inbox message, charges or billing entries are created. Save persists demo settings in `.runtime/carrier-demo.json`; this file is ignored by Git. Keep it on persistent storage if deploying a demo. Demo edits require the Super Admin role.

## Switching to a real provider
Use the same Edit screen, choose LIVE, and fill the provider-issued configuration. Save initially with Enable unchecked, test the saved connection, then enable when ready. Blank secret fields retain existing secrets. Demo mode refuses real secrets.

Before live use:
- Configure PostgreSQL and review/apply the additive `20260928000100_carrier_events` migration with the project's existing migration procedure. It has not been applied during this demo task.
- Stop running Node processes that load this project's Prisma client, then run `npm run prisma:generate` and restart. Windows can lock the engine DLL while the app is running.
- Configure `CARRIER_ENCRYPTION_KEY` as a cryptographically random 32-byte key encoded as base64. Store it securely outside source control and back it up; changing it without re-encrypting credentials makes them unreadable.
- Set `CARRIER_PUBLIC_BASE_URL` to the exact public HTTPS origin for Twilio verification. Provide a valid public TLS certificate and reachable callback endpoint.
- Assign receiving numbers to the provider and organization, configure client assignments and rates, and test transaction/billing behavior against a staging database before production.
- Promoting the built-in demo provider requires exactly one organization. With multiple organizations, create the intended provider first.

HTTP requires a provider API URL, authentication credentials, a read-only GET health/account URL, outbound format and callback authentication. Adapters include generic JSON, Twilio, Telnyx and Sinch outbound format. Provider-specific fields beyond these formats may need an adapter adjustment. Incoming generic/Sinch mapping supports top-level sender, recipient and body fields, with `id` or `providerMessageId`; validate your provider's exact payload before going live.

SMPP requires host, port, system ID, password, bind mode, TLS requirements, source/destination TON/NPI, allowed IPs, throughput and window limits from the carrier. Receiver binds receive; transmitter binds send; transceiver binds do both. TLS certificates are verified. Private carrier hosts are denied unless explicitly listed in `CARRIER_ALLOWED_PRIVATE_HOSTS` (comma-separated exact hostnames); configure only intended carrier endpoints.

## Callback and submission behavior
The callback URL is `/api/messages/callbacks/<connection-id>`. Only enabled LIVE connections accept authenticated callbacks.
- HMAC: hex SHA-256 signature of `timestamp + '.' + raw request body`, using the callback secret. Headers: `X-Webhook-Timestamp` (Unix seconds), `X-Webhook-Signature`. Five-minute tolerance.
- Twilio: `X-Twilio-Signature`, canonical public URL and form fields, using the Twilio auth token.
- Telnyx: Ed25519 signature and timestamp headers, using the provider public key; five-minute tolerance.
- Bearer: `Authorization: Bearer <callback-secret>` over HTTPS.

Authenticated, Super Admin-only submission endpoint: `POST /api/providers/<provider-id>/connections/<connection-id>/send`. JSON fields: `from`, E.164 `to`, `body`, and a unique `idempotencyKey` (8–128 characters). Reuse the same key only for the same submission. Carrier acceptance is not delivery. Receipts are stored separately. Unknown or partial submission outcomes are not automatically resent; reconcile with carrier records before a new submission.

Inbound HTTP requires a stable provider message ID. Message persistence and billing share a transaction. SMPP acknowledgements follow durable persistence; failures return a negative acknowledgement. Multipart segments are stored durably with a ten-minute assembly window. SMPP without a provider message ID deduplicates identical sender/recipient/body values for 60 seconds; two legitimate identical messages in that interval may merge. Multipart reference reuse within the window may collide. Confirm carrier retry/reference behavior before production.

## Verification and limits
Run `npm run test:carriers`, `npm run lint`, and `npm run build`. Local tests cover encryption, webhook signatures, protected routes, editable demos, HTTP redirects/network checks, GSM/Unicode segmentation, and mock SMSC bind/submit/acknowledgement/heartbeat behavior. No external provider, live PostgreSQL transaction flow, delivery or production load was tested. Multi-process SMPP ownership, expired event cleanup, delivery dashboard aggregation, provider-specific receipt variants and operational deployment still need production planning.

Protocol references: [node-smpp](https://github.com/farhadi/node-smpp), [Twilio webhook security](https://www.twilio.com/docs/usage/webhooks/webhooks-security), [Telnyx webhook verification](https://developers.telnyx.com/docs/development/api-fundamentals/webhooks/receiving-webhooks), [SMPP specifications](https://smpp.org/).

## Two SMPP connection directions

Edit a connection and choose who starts it. Create separate records if both directions are needed simultaneously. Each incoming record needs its own listening port. DEMO never opens a socket.

- CLIENT / Connect to Provider: this panel initiates the TCP connection and bind to the provider. Provider supplies host, port, System ID/password and bind mode. The provider must whitelist the public outbound IP of the laptop/VPS.
- SERVER / Accept Provider Connection: the provider connects to this panel. Configure our listening port, local interface, username/System ID, password, permitted provider IPs, and the bind mode the provider must use. The supplied provider IP is 95.154.228.78. All other source addresses are rejected. One authenticated bind per connection is accepted; a duplicate bind cannot evict it. Port conflicts produce an error.

The default local interface is 127.0.0.1. Public IP/hostname is descriptive for the handoff, not a bind interface. A laptop normally needs a router forwarding the chosen TCP port to its LAN IP plus a Windows firewall rule. Behind carrier-grade NAT, incoming access requires a public IP from the ISP or another reachable host such as a VPS. The laptop and app must stay running. No firewall/router rule is created by these changes. No real provider credential is generated or transmitted.

For incoming TLS, configure SMPP_SERVER_TLS_KEY_FILE and SMPP_SERVER_TLS_CERT_FILE on the host. Private keys are never entered through the panel. Saving an enabled LIVE server connection starts the listener during the runtime reconciliation loop. Status LISTENING means the port is open locally; BOUND/CONNECTED means the allowed provider has authenticated. A status check does not prove Internet reachability or SMS delivery. Keep DEMO until deployment is ready.

Server protocol: provider binds as transmitter to submit messages, receiver to receive deliver_sm, or transceiver for both. Inbound submit_sm is acknowledged after persistence; deliver_sm is also accepted for providers using that interconnect convention. Messages go through existing provider/number ownership and billing checks. Server outbound delivery uses deliver_sm and requires the provider's receiver/transceiver bind. Its acknowledgement only confirms peer acceptance, not mobile handset delivery. query_sm/cancel_sm/replace_sm/data_sm, generated final delivery receipts and multi-bind pooling are not implemented. Agree these protocol expectations with the provider.

These direction changes were implemented without running tests/build/browser checks, as requested. Live deployment requires validation with the provider.
