from __future__ import annotations

import html
import os
import re
import smtplib
import ssl
import certifi
from email.message import EmailMessage
from email.utils import parseaddr

from .contact import ContactPayload, MailConfigurationError


def _required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise MailConfigurationError(f"Missing mail configuration: {name}")
    return value


def _build_email(payload: ContactPayload) -> tuple[EmailMessage, str, str, int, str, str, bool]:
    recipient = _required_env("CONTACT_INBOX")
    brand = _required_env("BRAND_NAME")
    host = _required_env("SMTP_HOST")
    sender = _required_env("SMTP_FROM_EMAIL")
    username = _required_env("SMTP_USERNAME")
    password = _required_env("SMTP_PASSWORD")
    if len(brand) > 120 or any(ord(char) < 32 or ord(char) == 127 for char in brand):
        raise MailConfigurationError("BRAND_NAME is invalid.")
    try:
        port = int(_required_env("SMTP_PORT"))
    except ValueError as exc:
        raise MailConfigurationError("SMTP_PORT must be an integer.") from exc
    if port < 1 or port > 65535:
        raise MailConfigurationError("SMTP_PORT is outside the valid range.")
    for address in (recipient, sender):
        if parseaddr(address)[1] != address or not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", address):
            raise MailConfigurationError("A mail address is invalid.")

    starttls = os.getenv("SMTP_USE_STARTTLS", "true").strip().lower() not in {"0", "false", "no"}
    if port != 465 and not starttls:
        raise MailConfigurationError("SMTP requires STARTTLS or port 465 with implicit TLS.")

    # The subject and recipient are composed exclusively from fixed server configuration.
    subject = f"Website contact — {brand}"
    plain_message = (
        f"A new message was sent through the {brand} portfolio contact form.\n\n"
        f"Name: {payload.name}\n"
        f"Email: {payload.email}\n\n"
        f"Message:\n{payload.message}\n"
    )
    safe_name = html.escape(payload.name, quote=True)
    safe_email = html.escape(payload.email, quote=True)
    safe_message = html.escape(payload.message, quote=True).replace("\r\n", "\n").replace("\n", "<br>\n")
    safe_brand = html.escape(brand, quote=True)
    html_message = (
        "<!doctype html><html><body style=\"margin:0;background:#0b1016;color:#d8e0e5;"
        "font-family:Arial,sans-serif;padding:28px\">"
        f"<h1 style=\"font-size:18px;font-weight:500\">New message for {safe_brand}</h1>"
        "<table style=\"border-collapse:collapse;width:100%;max-width:640px\">"
        f"<tr><th align=\"left\">Name</th><td>{safe_name}</td></tr>"
        f"<tr><th align=\"left\">Email</th><td>{safe_email}</td></tr>"
        f"<tr><th align=\"left\" valign=\"top\">Message</th><td>{safe_message}</td></tr>"
        "</table></body></html>"
    )

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = sender
    message["To"] = recipient
    message["Reply-To"] = payload.email
    message.set_content(plain_message)
    message.add_alternative(html_message, subtype="html")
    return message, recipient, host, port, username, password, starttls


def deliver_contact_message(payload: ContactPayload) -> None:
    message, recipient, host, port, username, password, starttls = _build_email(payload)
    context = ssl.create_default_context(cafile=certifi.where())
    if port == 465:
        with smtplib.SMTP_SSL(host, port, timeout=12, context=context) as smtp:
            smtp.login(username, password)
            smtp.send_message(message, from_addr=message["From"], to_addrs=[recipient])
        return

    with smtplib.SMTP(host, port, timeout=12) as smtp:
        smtp.ehlo()
        if starttls:
            smtp.starttls(context=context)
            smtp.ehlo()
        smtp.login(username, password)
        smtp.send_message(message, from_addr=message["From"], to_addrs=[recipient])
