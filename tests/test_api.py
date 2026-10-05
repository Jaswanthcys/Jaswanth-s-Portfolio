from __future__ import annotations

import asyncio
import json
import unittest
from unittest.mock import patch

from server.app.contact import ContactPayload, MailConfigurationError
from server.app.main import post_contact


class ContactEndpointTests(unittest.TestCase):
    def setUp(self) -> None:
        self.payload = ContactPayload(
            name="QA Test",
            email="qa@example.com",
            message="This is a test message for the contact endpoint.",
        )

    def test_missing_mail_configuration_returns_safe_503(self) -> None:
        with patch(
            "server.app.main.deliver_contact_message",
            side_effect=MailConfigurationError("SMTP_PASSWORD=must-not-leak"),
        ) as deliver:
            response = asyncio.run(post_contact(self.payload))

        content = json.loads(response.body)
        self.assertEqual(response.status_code, 503)
        self.assertEqual(content, {
            "success": False,
            "message": "Transmission failed. Please try again later.",
        })
        self.assertNotIn("must-not-leak", response.body.decode())
        self.assertEqual(response.headers["cache-control"], "private, no-store")
        deliver.assert_called_once_with(self.payload)

    def test_smtp_or_provider_failure_returns_safe_502(self) -> None:
        with patch(
            "server.app.main.deliver_contact_message",
            side_effect=RuntimeError("provider diagnostic and credential must-not-leak"),
        ) as deliver:
            response = asyncio.run(post_contact(self.payload))

        content = json.loads(response.body)
        self.assertEqual(response.status_code, 502)
        self.assertEqual(content, {
            "success": False,
            "message": "Transmission failed. Please try again later.",
        })
        self.assertNotIn("provider diagnostic", response.body.decode())
        self.assertNotIn("must-not-leak", response.body.decode())
        self.assertEqual(response.headers["cache-control"], "private, no-store")
        deliver.assert_called_once_with(self.payload)

    def test_successful_mocked_delivery_returns_success_only_after_delivery(self) -> None:
        with patch("server.app.main.deliver_contact_message", return_value=None) as deliver:
            response = asyncio.run(post_contact(self.payload))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.body), {
            "success": True,
            "message": "Transmission received. Thank you — I’ll be in touch.",
        })
        deliver.assert_called_once_with(self.payload)


if __name__ == "__main__":
    unittest.main()
