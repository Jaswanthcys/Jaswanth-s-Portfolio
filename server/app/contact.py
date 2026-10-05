from __future__ import annotations

import re
from email.utils import parseaddr

from pydantic import BaseModel, ConfigDict, Field, field_validator


class MailConfigurationError(RuntimeError):
    """Required server-side mail settings are absent or invalid."""


class ContactPayload(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=3, max_length=254)
    message: str = Field(min_length=10, max_length=4000)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        if not value.strip() or any(ord(char) < 32 and char != "\t" for char in value):
            raise ValueError("Enter a valid name.")
        return value.strip()

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip()
        display_name, parsed = parseaddr(normalized)
        if display_name or parsed != normalized or not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", normalized):
            raise ValueError("Enter a valid email address.")
        if any(ord(char) < 32 for char in normalized):
            raise ValueError("Enter a valid email address.")
        return normalized

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str) -> str:
        if len(value.strip()) < 10 or any(ord(char) == 0 for char in value):
            raise ValueError("Write a message of at least 10 characters.")
        return value.strip()
