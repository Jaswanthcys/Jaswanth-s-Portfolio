from __future__ import annotations

import asyncio
import logging
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .contact import ContactPayload, MailConfigurationError
from .mailer import deliver_contact_message

PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env")

PUBLIC_DIR = PROJECT_ROOT / "public"

app = FastAPI(
    title="Kai Mori Portfolio API",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)

logger = logging.getLogger(__name__)


@app.middleware("http")
async def prevent_api_caching(request: Request, call_next):
    response = await call_next(request)

    if request.url.path == "/api" or request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "private, no-store"

    return response


@app.get("/healthz", include_in_schema=False)
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/contact")
async def post_contact(payload: ContactPayload) -> JSONResponse:
    try:
        await asyncio.to_thread(deliver_contact_message, payload)

    except MailConfigurationError:
        logger.warning(
            "Contact email configuration is missing or invalid."
        )

        return JSONResponse(
            status_code=503,
            content={
                "success": False,
                "message": "Transmission failed. Please try again later.",
            },
            headers={"Cache-Control": "private, no-store"},
        )

    except Exception as exc:
        # Do not send SMTP hostnames, credentials, stack traces,
        # or provider errors to visitors.
        logger.error(
            "Contact email delivery failed (exception type: %s).",
            type(exc).__name__,
        )

        return JSONResponse(
            status_code=502,
            content={
                "success": False,
                "message": "Transmission failed. Please try again later.",
            },
            headers={"Cache-Control": "private, no-store"},
        )

    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "message": "Transmission received. Thank you — I’ll be in touch.",
        },
        headers={"Cache-Control": "private, no-store"},
    )


# Development auto-refresh endpoint.
# The browser checks this value and reloads when anything
# inside the public/ folder changes.
@app.get("/__dev_version", include_in_schema=False)
async def dev_version() -> dict[str, int]:
    latest_mtime_ns = 0

    for path in PUBLIC_DIR.rglob("*"):
        if path.is_file():
            try:
                latest_mtime_ns = max(
                    latest_mtime_ns,
                    path.stat().st_mtime_ns,
                )
            except OSError:
                continue

    return {"version": latest_mtime_ns}


# The published gateway serves declared static output and sends /api/*
# to this application. Mounting public/ here gives the same-origin page
# and assets.
app.mount(
    "/",
    StaticFiles(directory=str(PUBLIC_DIR), html=True),
    name="portfolio",
)