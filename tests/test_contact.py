from __future__ import annotations

import os
import unittest
from unittest.mock import patch

from pydantic import ValidationError

from server.app.contact import ContactPayload, MailConfigurationError
from server.app.mailer import _build_email


VALID_MAIL_ENV = {
    "CONTACT_INBOX": "owner@example.com",
    "BRAND_NAME": "KM Archive",
    "SMTP_HOST": "smtp.example.net",
    "SMTP_PORT": "587",
    "SMTP_FROM_EMAIL": "site@example.net",
    "SMTP_USERNAME": "server-user",
    "SMTP_PASSWORD": "test-double-only-secret",
    "SMTP_USE_STARTTLS": "true",
}


class ContactPayloadTests(unittest.TestCase):
    def test_accepts_only_the_three_public_fields(self) -> None:
        payload = ContactPayload(name="Kai Mori", email="kai@example.com", message="Hello, this is a message.")
        self.assertEqual(payload.model_dump(), {
            "name": "Kai Mori",
            "email": "kai@example.com",
            "message": "Hello, this is a message.",
        })

    def test_rejects_empty_and_too_short_names(self) -> None:
        for name in ("", " ", "K"):
            with self.subTest(name=name), self.assertRaises(ValidationError):
                ContactPayload(name=name, email="kai@example.com", message="Hello, this is a message.")

    def test_rejects_invalid_email(self) -> None:
        for email in ("not-an-email", "kai@", "Kai <kai@example.com>", "kai@example.com\nBcc:bad@example.net"):
            with self.subTest(email=email), self.assertRaises(ValidationError):
                ContactPayload(name="Kai Mori", email=email, message="Hello, this is a message.")

    def test_rejects_empty_or_short_message(self) -> None:
        for message in ("", " ", "short", "123456789"):
            with self.subTest(message=message), self.assertRaises(ValidationError):
                ContactPayload(name="Kai Mori", email="kai@example.com", message=message)

    def test_rejects_extra_fields_so_recipient_cannot_be_selected_by_client(self) -> None:
        with self.assertRaises(ValidationError):
            ContactPayload(name="Kai Mori", email="kai@example.com", message="Hello, this is a message.", to="attacker@example.com")

    def test_fixed_recipient_subject_reply_to_and_html_escaping(self) -> None:
        payload = ContactPayload(
            name="<Kai>",
            email="kai@example.com",
            message="A safe message with </td><script>alert(1)</script>.",
        )
        with patch.dict(os.environ, VALID_MAIL_ENV, clear=True):
            message, recipient, host, port, username, password, starttls = _build_email(payload)
        self.assertEqual(recipient, "owner@example.com")
        self.assertEqual(message["To"], "owner@example.com")
        self.assertEqual(message["Subject"], "Website contact — KM Archive")
        self.assertEqual(message["Reply-To"], "kai@example.com")
        self.assertEqual((host, port, username, password, starttls), ("smtp.example.net", 587, "server-user", "test-double-only-secret", True))
        html_body = message.get_payload()[1].get_payload(decode=True).decode("utf-8")
        self.assertIn("&lt;Kai&gt;", html_body)
        self.assertIn("&lt;/td&gt;&lt;script&gt;", html_body)
        self.assertNotIn("<script>", html_body)
        self.assertNotIn("attacker@example", html_body)

    def test_fails_closed_when_required_mail_settings_are_missing(self) -> None:
        payload = ContactPayload(name="Kai Mori", email="kai@example.com", message="Hello, this is a message.")
        for setting in VALID_MAIL_ENV.keys() - {"SMTP_USE_STARTTLS"}:
            env = {key: value for key, value in VALID_MAIL_ENV.items() if key != setting}
            with self.subTest(setting=setting), patch.dict(os.environ, env, clear=True):
                with self.assertRaises(MailConfigurationError):
                    _build_email(payload)

    def test_starttls_defaults_to_secure_enabled(self) -> None:
        payload = ContactPayload(name="Kai Mori", email="kai@example.com", message="Hello, this is a message.")
        env = {key: value for key, value in VALID_MAIL_ENV.items() if key != "SMTP_USE_STARTTLS"}
        with patch.dict(os.environ, env, clear=True):
            _, _, _, port, _, _, starttls = _build_email(payload)
        self.assertEqual(port, 587)
        self.assertTrue(starttls)

    def test_disallows_cleartext_smtp_credentials_on_non_tls_port(self) -> None:
        payload = ContactPayload(name="Kai Mori", email="kai@example.com", message="Hello, this is a message.")
        unsafe = {**VALID_MAIL_ENV, "SMTP_USE_STARTTLS": "false"}
        with patch.dict(os.environ, unsafe, clear=True), self.assertRaises(MailConfigurationError):
            _build_email(payload)

    def test_supports_implicit_tls_on_port_465(self) -> None:
        payload = ContactPayload(name="Kai Mori", email="kai@example.com", message="Hello, this is a message.")
        implicit_tls = {**VALID_MAIL_ENV, "SMTP_PORT": "465", "SMTP_USE_STARTTLS": "false"}
        with patch.dict(os.environ, implicit_tls, clear=True):
            _, _, _, port, _, _, starttls = _build_email(payload)
        self.assertEqual(port, 465)
        self.assertFalse(starttls)


if __name__ == "__main__":
    unittest.main()
