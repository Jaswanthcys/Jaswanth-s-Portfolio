# Cinematic Developer Portfolio

A single-page personal portfolio for Kai Mori, styled as a cinematic archive with an original samurai-duel opening sequence. The frontend is served by the same FastAPI application that exposes the contact endpoint, so browser requests use the same origin.

> This handoff preserves the stack in the supplied archive: static HTML, CSS and JavaScript ES modules plus FastAPI/Python. It is **not** a React/Vite or MongoDB project. No database is required by the current application.

## Features

- Click-to-start cinematic loading sequence with two shadow warriors, a katana duel, sparks, final strike/landing and portfolio reveal.
- Canvas scene, local moonlit background art, synthesized Web Audio cues, sound toggle, custom desktop cursor, Tokyo clock and reduced-motion handling.
- Responsive long-form hero, skills, mission/project cards, profile dossier, journey timeline and contact section.
- Data-driven mission cards open an accessible project-detail dialog; real repository/demo actions appear only when verified URLs are configured. Missing destinations remain clearly non-clickable.
- Hero résumé link opens the one-page PDF in a new browser tab; the editable Typst source is included. Missing resume facts are visibly marked for replacement, not invented.
- Four data-driven certificate cards and an accessible fullscreen dialog with Escape, close-button and backdrop dismissal. Optional verification URLs are supported.
- Same-origin `POST /api/contact` FastAPI endpoint with validation, server-side SMTP delivery, fixed subject/recipient configuration, escaped HTML and plain-text email, and visitor Reply-To.

## Technology stack

- **Frontend:** HTML5, CSS3, vanilla JavaScript ES modules, Canvas 2D, Web Audio API.
- **Backend:** Python 3.12 (container image), FastAPI, Uvicorn, Pydantic.
- **Email:** Python `smtplib` with STARTTLS (normally port 587) or implicit TLS (port 465).
- **Storage/database:** local, versioned static assets only; no MongoDB or other database.
- **Build tooling:** no npm install, frontend bundler or separate API URL is needed. FastAPI serves the `public/` directory and `/api/*` from one origin.

## Project structure

```text
.
├── public/
│   ├── assets/                 # Local scene art, sample certificates and résumé files
│   ├── scripts/                # Application, data, scene, audio and cursor modules
│   ├── styles/portfolio.css    # Responsive portfolio styling
│   ├── index.html              # Single-page interface
│   └── manus-routes.json       # Page-route declaration
├── server/app/
│   ├── main.py                 # FastAPI, /healthz, /api/contact and static serving
│   ├── contact.py              # Request schema and input validation
│   └── mailer.py               # SMTP config, message creation and delivery
├── tests/                      # Python unittest coverage
├── .env.example                # Safe configuration template; contains no credentials
├── CERTIFICATES.md             # Certificate image/data replacement guide
├── Dockerfile                  # Single-container runtime (PORT defaults to 8080)
├── requirements.txt            # Pinned Python dependencies
└── README.md
```

`ideas.md` retains the original design direction. The project intentionally keeps this layout instead of splitting it into unused `frontend/` and `backend/` scaffolding.

## Requirements

- Python 3.10 or newer (the supplied container uses Python 3.12).
- A real SMTP account/provider and verified sender address to deliver contact messages.
- Docker is optional; only needed for container execution.

## Install and run locally

From the project root:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

Edit `.env` and replace the example recipient, host, sender and credentials with values issued by your email provider. Load the file into the server process and start FastAPI:

```bash
set -a
. ./.env
set +a
uvicorn server.app.main:app --reload --host 127.0.0.1 --port 8000
```

Open <http://127.0.0.1:8000/>. The same app serves the frontend, static assets and contact API. Check readiness at <http://127.0.0.1:8000/healthz>. Do not commit the filled `.env` file.

### Environment variables

| Variable | Required | Purpose |
|---|---:|---|
| `BRAND_NAME` | Yes | Brand text used in the fixed email subject/body. |
| `CONTACT_INBOX` | Yes | Server-side destination mailbox. |
| `SMTP_HOST` | Yes | SMTP server hostname from the chosen provider. |
| `SMTP_PORT` | Yes | SMTP port; usually `587` for STARTTLS or `465` for implicit TLS. |
| `SMTP_FROM_EMAIL` | Yes | Provider-authorized sender address. |
| `SMTP_USERNAME` | Yes | SMTP authentication username. |
| `SMTP_PASSWORD` | Yes | SMTP credential/app password; keep server-side. |
| `SMTP_USE_STARTTLS` | No | Defaults to `true`; set `false` only when using port `465` with implicit TLS. |

`.env.example` deliberately uses reserved example addresses/domains and non-functional credential placeholders. Those values cannot deliver email; replace them locally with real provider configuration. The frontend contains no SMTP secrets.

## Contact and email setup

1. Choose an SMTP provider and create its server-side SMTP credential. If required by the provider, verify the sender domain/address and create an app password.
2. Set `CONTACT_INBOX` to the mailbox that should receive messages, `SMTP_FROM_EMAIL` to an authorized sender, and fill the host, port, username and password in the local `.env` or the deployment's secret/environment-variable settings.
3. Keep the normal transport encrypted: STARTTLS on port `587`, or implicit TLS on port `465` with `SMTP_USE_STARTTLS=false`.
4. Start the application and submit the contact form with a real test message only when you are ready to send one to the configured inbox. A successful response is returned only after SMTP delivery completes.

The contact form posts JSON to relative URL `/api/contact`; there is no hardcoded production API URL. Since the page and API share an origin, the app does not enable permissive wildcard CORS. Keep them same-origin or configure an explicit trusted-origin policy if the architecture is deliberately changed.

The backend rejects malformed requests with FastAPI/Pydantic validation responses. Missing/invalid SMTP configuration returns HTTP 503; provider/network delivery errors return HTTP 502. Both use the user-facing message “Transmission failed. Please try again later.” and do not return credentials, provider diagnostics or stack traces. The form disables its button while sending, waits for the actual response, clears inputs only after success, and keeps the message available for retry after failure.

## Editing portfolio content

### Projects

Edit the `projects` array in `public/scripts/config.js`. Each object has `title`, `description`, `details`, `technologies`, `github`, and `live`. Clicking a mission card opens its detail dialog without navigating away. Set `github` and/or `live` only to real project URLs; leave a field empty until its actual destination is known. Configured repository/demo actions are separate, open in a new tab, and use `rel="noopener noreferrer"`. The site intentionally does not guess destinations from generic project titles.

**Current owner-specific data is incomplete:** no real repository URLs or live-demo URLs were supplied for the four starter projects. Their former `REPLACE_USERNAME` links were confirmed to return 404 and have been removed. Consequently, the UI marks repository destinations as “REPOSITORY LINK TO BE ADDED”; no live-demo actions appear until URLs are supplied. The social profile and direct email link are likewise unconfigured.

### Certificates

Replace the four sample SVGs in `public/assets/certificates/` with real certificate images and edit the `certificates` array in `public/scripts/config.js`. Each entry supports `title`, `issuer`, `date`, and `image`, plus optional `verificationUrl`. See [CERTIFICATES.md](CERTIFICATES.md). Current certificate artwork and issuer values are samples, not claims of earned credentials.

### Personal details

Update `identity`, `links`, `profile`, `skills`, `journey`, and `hud` in `public/scripts/config.js`. Add a real email/GitHub/LinkedIn value only when the owner confirms it. Do not use sample or reserved example-domain addresses as contact destinations.

### Résumé

The hero's `VIEW RESUME` link opens `public/assets/resume/Kai-Mori-Resume.pdf` in a new tab for browser PDF viewing (and the browser viewer's download control). Edit `public/assets/resume/Kai-Mori-Resume.typ` with Typst to update it. Only the name, student-developer role, Tokyo location, profile statement, interests and current focus are sourced from the original config; education, verified skills, projects, email/profile URLs, activities, certificates and achievements remain bracketed placeholders. Replace or remove every bracketed field before using the résumé; the current data does not support claiming any of those missing qualifications.

## Container deployment

The included Dockerfile serves static files and the API together. Build and run locally with:

```bash
docker build -t kaimori-portfolio .
docker run --rm -p 8080:8080 --env-file .env -e PORT=8080 kaimori-portfolio
```

For a hosted container, provide the SMTP values through the host's protected environment-variable/secret settings, not a committed file or frontend build. The container listens on `PORT` (default `8080`) and exposes unauthenticated `GET /healthz`. If hosting the frontend separately, route `/api/*` to the FastAPI service on the same public origin or configure exact CORS origins; do not use wildcard CORS as a shortcut. This package is **not currently deployed or published**.

## Tests

Run the existing and added backend tests from the repository root:

```bash
python -m unittest discover -s tests -v
```

The tests validate empty/short/invalid input, fixed-recipient/sender composition, safe HTML escaping, TLS requirements, safe configuration/provider failures and successful delivery through a mocked SMTP sender. No test transmits an email. Real inbox delivery cannot be verified until valid provider credentials and a recipient mailbox are configured.

## Troubleshooting

- **HTTP 503 on contact:** one or more required mail environment variables are absent/invalid. Check that the variables are loaded into the Uvicorn/container process; `.env.example` is only a template.
- **HTTP 502 on contact:** configuration was accepted but SMTP connection/authentication/delivery failed. Verify provider host/port, verified sender, credentials, TLS mode, and outbound SMTP access. Internal errors are intentionally not shown to visitors.
- **Frontend cannot reach the API:** open the FastAPI origin (port `8000` locally), check `/healthz`, and confirm `POST /api/contact` uses the same origin. The project does not have a separate Vite server or `VITE_API_URL`.
- **CORS error:** keep the static page and API same-origin. If you intentionally split them, configure only the exact allowed site origin in the backend/proxy.
- **Repository/demo link is absent:** add a verified owner-specific URL to the matching project object. No valid project owner/repository URLs were supplied for this package.
- **Certificate image is missing:** confirm the path is relative to `public/`, e.g. `/assets/certificates/my-certificate.jpg`, and that the local file exists.
- **MongoDB connection failure:** this project does not use MongoDB; no database connection is required.

## Security and handoff notes

- `.env`, `.env.*`, virtual environments, caches and build output are ignored; `.env.example` is retained.
- Never commit SMTP passwords, API keys or private credentials, and never put them in frontend code.
- The recipient and subject are server-controlled. Visitor text is validated and HTML-escaped; the visitor's address is used only as Reply-To.
- Do not change the contact endpoint into an open relay or allow visitors to select the recipient/subject.
- SMTP credentials, real project/social URLs, a real portfolio email, and genuine certificate images remain owner-provided setup items.

## Final verification checklist

- [x] Frontend starts: the local site serves `GET /` successfully from FastAPI.
- [x] Backend starts: `GET /healthz` returns `{"status":"ok"}`.
- [x] Contact API tests cover invalid input, safe 503/502 failures, and successful mocked delivery; no test sends a real email. A live send still requires provider configuration.
- [x] Contact UI only reports success after the API confirms delivery; on API/network failure it shows the requested generic transmission error, clears the sending state and preserves the message for retry.
- [ ] Real email delivery: requires actual SMTP credentials, an authorized sender and the intended recipient inbox; no credentials were present and no email was sent.
- [ ] Real GitHub/live-demo links and owner contact/profile URLs: no verified owner-specific URLs were supplied, so fake links were removed and not recreated.
- [x] Four certificate cards open the image viewer; the image loads and Escape, close-button and outside-click dismissal work. The certificate artwork/data remain explicitly identified as samples.
- [x] Existing project cards open their mission-detail dialog; close button, Escape and backdrop dismissal are supported, and missing repository/demo targets cannot be clicked.
- [x] Résumé PDF opens as an `application/pdf` browser document, is one-page/A4 and contains clearly marked replacement fields; its editable Typst source is included.
- [x] Mobile/reduced-motion QA at 390×844: navigation, certificate viewer, sound toggle and contact UI work without horizontal overflow.
- [x] No JavaScript exceptions or unexpected asset/network errors. The no-SMTP test intentionally returns HTTP 503, which appears as the expected failed API request in browser tooling.
- [x] No `.env` or real credentials are included; `.env.example` contains placeholders only.
- [ ] Public deployment: stopped at the user's request; this is a local preview/source handoff, not a permanently published site.

No screenshot reference was present among the uploaded files, so visual QA used the live local page at desktop and mobile viewport sizes.
