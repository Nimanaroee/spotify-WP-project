import json
import logging
from decimal import Decimal, ROUND_HALF_UP
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings

logger = logging.getLogger(__name__)

USD_TO_IRR_RATE = Decimal("1900000")

ZARINPAL_ERROR_MESSAGES = {
    -9: "The payment request is invalid. Please review the submitted information.",
    -10: "The payment terminal is invalid. Please contact support.",
    -11: "The payment terminal is inactive. Please contact support.",
    -12: "Too many payment attempts were made. Please try again later.",
    -13: "The payment terminal has reached its transaction limit.",
    -14: "The payment callback address is not allowed for this terminal.",
    -15: "The payment terminal is suspended. Please contact support.",
    -16: "The payment terminal is not eligible to accept payments.",
    -17: "The payment terminal has account-level restrictions.",
    -18: "This payment terminal cannot be used from this domain.",
    -19: "Payments are disabled for this terminal.",
    -30: "The terminal cannot accept this payment configuration.",
    -41: "The payment amount exceeds Zarinpal's maximum limit.",
    -50: "The verified amount does not match the original payment request.",
    -51: "The payment was not completed.",
    -52: "Zarinpal could not verify this payment. Please contact support.",
    -53: "This payment does not belong to the configured terminal.",
    -54: "The payment authority is invalid.",
    -55: "The payment request was not found.",
}


class ZarinpalGatewayError(Exception):
    def __init__(self, message, *, code=None, payload=None, http_status=502):
        super().__init__(message)
        self.code = code
        self.payload = payload or {}
        self.http_status = http_status


def get_gateway_base_url():
    if settings.ZARINPAL_SANDBOX:
        return "https://sandbox.zarinpal.com"
    return "https://payment.zarinpal.com"


def get_gateway_amount(amount: Decimal) -> int:
    return int(
        (amount * USD_TO_IRR_RATE).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    )


def get_error_message(code, fallback=None):
    if fallback:
        return fallback
    if code == 100:
        return "Payment request completed successfully."
    if code == 101:
        return "This payment was already verified."
    return ZARINPAL_ERROR_MESSAGES.get(
        code, fallback or "The payment gateway rejected the request."
    )


def _gateway_error_from_response(response_payload, *, http_status=400):
    data = response_payload.get("data") or {}
    errors = response_payload.get("errors") or {}
    error = errors[0] if isinstance(errors, list) and errors else errors
    error = error if isinstance(error, dict) else {}
    code = error.get("code", data.get("code"))
    fallback = error.get("message") or data.get("message")
    return ZarinpalGatewayError(
        get_error_message(code, fallback),
        code=code,
        payload=response_payload,
        http_status=http_status,
    )


def _post_to_zarinpal(path, payload, *, successful_codes=(100,)):
    request = Request(
        f"{get_gateway_base_url()}{path}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Accept": "application/json", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=settings.ZARINPAL_REQUEST_TIMEOUT) as response:
            response_payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        response_text = exc.read().decode("utf-8", errors="replace")
        try:
            response_payload = json.loads(response_text)
        except json.JSONDecodeError:
            logger.warning(
                "Zarinpal returned HTTP %s with a non-JSON response: %s",
                exc.code,
                response_text,
            )
            raise ZarinpalGatewayError(
                f"Zarinpal returned HTTP {exc.code}. Please try again shortly.",
                payload={"http_status": exc.code, "response": response_text},
            ) from exc

        gateway_error = _gateway_error_from_response(response_payload)
        logger.warning(
            "Zarinpal returned HTTP %s. code=%s message=%s response=%s",
            exc.code,
            gateway_error.code,
            str(gateway_error),
            response_payload,
        )
        raise gateway_error from exc
    except (URLError, TimeoutError, json.JSONDecodeError) as exc:
        logger.exception("Zarinpal gateway request failed.")
        raise ZarinpalGatewayError(
            "Unable to connect to Zarinpal. Please try again shortly."
        ) from exc

    code = (response_payload.get("data") or {}).get("code")
    if code not in successful_codes:
        gateway_error = _gateway_error_from_response(response_payload)
        logger.warning(
            "Zarinpal rejected a gateway request. code=%s message=%s response=%s",
            gateway_error.code,
            str(gateway_error),
            response_payload,
        )
        raise gateway_error
    return response_payload


def request_payment(*, amount, description, callback_url, metadata):
    if not settings.ZARINPAL_MERCHANT_ID:
        raise ZarinpalGatewayError(
            "Payments are not configured yet. Please contact support.",
            http_status=503,
        )

    return _post_to_zarinpal(
        "/pg/v4/payment/request.json",
        {
            "merchant_id": settings.ZARINPAL_MERCHANT_ID,
            "amount": get_gateway_amount(amount),
            "currency": "IRR",
            "description": description,
            "callback_url": callback_url,
            "metadata": metadata,
        },
    )


def verify_payment(*, amount, authority):
    if not settings.ZARINPAL_MERCHANT_ID:
        raise ZarinpalGatewayError(
            "Payments are not configured yet. Please contact support.",
            http_status=503,
        )

    return _post_to_zarinpal(
        "/pg/v4/payment/verify.json",
        {
            "merchant_id": settings.ZARINPAL_MERCHANT_ID,
            "amount": get_gateway_amount(amount),
            "currency": "IRR",
            "authority": authority,
        },
        successful_codes=(100, 101),
    )
