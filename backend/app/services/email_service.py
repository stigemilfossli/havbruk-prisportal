import os
import logging
from datetime import datetime
from typing import List

logger = logging.getLogger(__name__)

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "prisportal@yourdomain.no")
FROM_NAME = os.getenv("FROM_NAME", "Havbruk Prisportal")
BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")


def _get_rfq_html(quote_request, supplier, items, token: str) -> str:
    items_rows = ""
    for item in items:
        product_name = item.product.name if item.product else f"Produkt #{item.product_id}"
        unit = item.unit or (item.product.unit if item.product else "stk")
        notes = item.notes or ""
        items_rows += f"""
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">{product_name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">{item.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">{unit}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">{notes}</td>
        </tr>"""

    response_url = f"{BASE_URL}/tilbud/svar/{token}"
    company = quote_request.requester_company or quote_request.requester_name
    date_str = datetime.utcnow().strftime("%d.%m.%Y")

    return f"""<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Tilbudsforespørsel - Havbruk Prisportal</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);">
          <!-- Header -->
          <tr>
            <td style="background:#0f3460;padding:32px 40px;">
              <h1 style="margin:0;color:#fff;font-size:24px;">🐟 Havbruk Prisportal</h1>
              <p style="margin:8px 0 0;color:#a3c4e0;font-size:14px;">Tilbudsforespørsel #{quote_request.id}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="color:#374151;font-size:16px;margin:0 0 16px;">Hei <strong>{supplier.name}</strong>,</p>
              <p style="color:#374151;font-size:15px;margin:0 0 24px;">
                Vi mottar gjerne et tilbud på følgende produkter på vegne av
                <strong>{company}</strong>. Forespørselen ble sendt <strong>{date_str}</strong>.
              </p>

              <!-- Products table -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-bottom:28px;">
                <thead>
                  <tr style="background:#f9fafb;">
                    <th style="padding:10px 12px;text-align:left;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;">Varenavn</th>
                    <th style="padding:10px 12px;text-align:center;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;">Antall</th>
                    <th style="padding:10px 12px;text-align:center;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;">Enhet</th>
                    <th style="padding:10px 12px;text-align:left;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;">Notat</th>
                  </tr>
                </thead>
                <tbody>{items_rows}
                </tbody>
              </table>

              <p style="color:#374151;font-size:15px;margin:0 0 24px;">
                Vennligst gi oss pris per enhet, estimert leveringstid og gyldighetsperiode
                for tilbudet. Svar direkte ved å klikke knappen nedenfor:
              </p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#0ea5e9;border-radius:6px;">
                    <a href="{response_url}"
                       style="display:inline-block;padding:14px 32px;color:#fff;font-size:16px;
                              font-weight:bold;text-decoration:none;">
                      Gi tilbud
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;">
                Eller kopier denne lenken: <a href="{response_url}" style="color:#0ea5e9;">{response_url}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                Havbruk Prisportal &bull; post@havbrukprisportal.no &bull;
                Har du spørsmål? Svar på denne e-posten.<br>
                Kontaktperson: {quote_request.requester_name} ({quote_request.requester_email})
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _get_notification_html(quote_request, supplier) -> str:
    return f"""<!DOCTYPE html>
<html lang="no">
<head><meta charset="UTF-8"><title>Tilbud mottatt</title></head>
<body style="font-family:Arial,sans-serif;background:#f0f4f8;margin:0;padding:40px 20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;
              padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.1);">
    <h2 style="color:#0f3460;margin-top:0;">Tilbud mottatt</h2>
    <p style="color:#374151;">Hei <strong>{quote_request.requester_name}</strong>,</p>
    <p style="color:#374151;">
      Du har mottatt et nytt tilbud fra <strong>{supplier.name}</strong>
      på forespørsel <strong>#{quote_request.id}</strong>.
    </p>
    <p style="color:#374151;">
      Logg inn på Havbruk Prisportal for å se tilbudet og sammenligne priser.
    </p>
    <a href="{BASE_URL}/tilbudsforesporsler/{quote_request.id}"
       style="display:inline-block;background:#0ea5e9;color:#fff;padding:12px 28px;
              border-radius:6px;text-decoration:none;font-weight:bold;">
      Se tilbudet
    </a>
    <p style="color:#9ca3af;font-size:12px;margin-top:24px;">Havbruk Prisportal</p>
  </div>
</body>
</html>"""


def _get_reminder_html(quote_request, supplier, token: str) -> str:
    response_url = f"{BASE_URL}/tilbud/svar/{token}"
    return f"""<!DOCTYPE html>
<html lang="no">
<head><meta charset="UTF-8"><title>Påminnelse - Tilbudsforespørsel</title></head>
<body style="font-family:Arial,sans-serif;background:#f0f4f8;margin:0;padding:40px 20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;
              padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.1);">
    <h2 style="color:#0f3460;margin-top:0;">Påminnelse: Tilbudsforespørsel #{quote_request.id}</h2>
    <p style="color:#374151;">Hei <strong>{supplier.name}</strong>,</p>
    <p style="color:#374151;">
      Vi sender en vennlig påminnelse om tilbudsforespørselen vi sendte for 3 dager siden.
      Vi setter pris på om du kan gi oss et tilbud så snart som mulig.
    </p>
    <a href="{response_url}"
       style="display:inline-block;background:#0ea5e9;color:#fff;padding:12px 28px;
              border-radius:6px;text-decoration:none;font-weight:bold;">
      Gi tilbud nå
    </a>
    <p style="color:#9ca3af;font-size:12px;margin-top:24px;">Havbruk Prisportal</p>
  </div>
</body>
</html>"""


def _send_email(to_email: str, to_name: str, subject: str, html_content: str) -> bool:
    if not SENDGRID_API_KEY:
        logger.warning(
            "SENDGRID_API_KEY ikke satt - e-post simulert til %s: %s", to_email, subject
        )
        return True

    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail, Email, To, Content

        sg = sendgrid.SendGridAPIClient(api_key=SENDGRID_API_KEY)
        message = Mail(
            from_email=Email(FROM_EMAIL, FROM_NAME),
            to_emails=To(to_email, to_name),
            subject=subject,
            html_content=Content("text/html", html_content),
        )
        response = sg.client.mail.send.post(request_body=message.get())
        logger.info("E-post sendt til %s (status %s)", to_email, response.status_code)
        return True
    except Exception as exc:
        logger.error("Feil ved sending av e-post til %s: %s", to_email, exc)
        return False


def send_rfq_email(quote_request, supplier, items, token: str) -> bool:
    html = _get_rfq_html(quote_request, supplier, items, token)
    subject = f"Tilbudsforespørsel #{quote_request.id} fra Havbruk Prisportal"
    return _send_email(supplier.email or "", supplier.name, subject, html)


def send_quote_received_notification(quote_request, supplier) -> bool:
    html = _get_notification_html(quote_request, supplier)
    subject = f"Tilbud mottatt fra {supplier.name} - Forespørsel #{quote_request.id}"
    return _send_email(
        quote_request.requester_email,
        quote_request.requester_name,
        subject,
        html,
    )


def send_rfq_reminder(quote_request, supplier, token: str) -> bool:
    html = _get_reminder_html(quote_request, supplier, token)
    subject = f"Påminnelse: Tilbudsforespørsel #{quote_request.id}"
    return _send_email(supplier.email or "", supplier.name, subject, html)
