package tn.esprit.peakwell.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailConsultationService {

  private final JavaMailSender mailSender;

  @Value("${app.mail.from}")
  private String from;

  @Async
  public void send(String to, String subject, String htmlBody) {
    if (to == null || to.isBlank()) {
      log.warn("Email skipped — no recipient address");
      return;
    }
    try {
      MimeMessage msg = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
      helper.setFrom(from);
      helper.setTo(to);
      helper.setSubject(subject);
      helper.setText(htmlBody, true);
      mailSender.send(msg);
      log.info("Email sent to {} — {}", to, subject);
    } catch (Exception e) {
      log.error("Failed to send email to {}: {}", to, e.getMessage());
    }
  }

  // ── Templates ────────────────────────────────────────────────────────────

  public void sendBookingReceived(String to, String patientName, String doctorName, String date) {
    String subject = "📋 Appointment Request Received — PeakWell";
    String body = template(patientName,
      "Your appointment request has been received",
      "You have requested a consultation with <strong>" + doctorName + "</strong> on <strong>" + date + "</strong>.<br><br>" +
      "Your nutritionist will review your request and confirm or suggest an alternative shortly.",
      "#f0a84a", "⏳ Pending Confirmation"
    );
    send(to, subject, body);
  }

  public void sendBookingConfirmed(String to, String patientName, String doctorName, String date) {
    String subject = "✅ Appointment Confirmed — PeakWell";
    String body = template(patientName,
      "Your appointment is confirmed!",
      "Great news! Your consultation with <strong>" + doctorName + "</strong> on <strong>" + date + "</strong> has been <strong>confirmed</strong>.<br><br>" +
      "Please make sure you are available at the scheduled time.",
      "#7a9e7e", "✅ Confirmed"
    );
    send(to, subject, body);
  }

  public void sendCancellationToDietitian(String to, String dietitianName, String patientName, String date) {
    String subject = "❌ Appointment Cancelled — PeakWell";
    String body = template(dietitianName,
      "An appointment has been cancelled",
      "Your patient <strong>" + patientName + "</strong> has cancelled their consultation scheduled for <strong>" + date + "</strong>.<br><br>" +
      "This slot is now free. You can log in to PeakWell to view your updated schedule.",
      "#c96a3f", "❌ Cancelled by Patient"
    );
    send(to, subject, body);
  }

  public void sendBookingRejected(String to, String patientName, String doctorName, String date, String reason) {
    String subject = "❌ Appointment Request Declined — PeakWell";
    String reasonBlock = (reason != null && !reason.isBlank())
      ? "<br><br><strong>Reason:</strong> " + reason
      : "";
    String body = template(patientName,
      "Your appointment request was declined",
      "Unfortunately, your consultation request with <strong>" + doctorName + "</strong> on <strong>" + date + "</strong> has been <strong>declined</strong>." +
      reasonBlock + "<br><br>You can book a new appointment at any time from your dossier.",
      "#c96a3f", "❌ Declined"
    );
    send(to, subject, body);
  }

  /**
   * Rejection email that includes 1–3 alternative slot links the patient can click to confirm.
   *
   * @param suggestions list of (formattedDate, confirmationUrl) pairs
   */
  public void sendRejectionWithSuggestions(
      String to, String patientName, String doctorName,
      String originalDate, String reason,
      List<String[]> suggestions) {

    String subject = "❌ Rendez-vous refusé — Créneaux alternatifs disponibles · PeakWell";

    StringBuilder slotsHtml = new StringBuilder();
    for (int i = 0; i < suggestions.size(); i++) {
      String[] s = suggestions.get(i);
      slotsHtml.append("""
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #ede8e3;">
              <span style="font-size:14px;color:#2d2d2d;font-weight:600;">%s</span>
            </td>
            <td style="padding:10px 0;border-bottom:1px solid #ede8e3;text-align:right;">
              <a href="%s"
                 style="display:inline-block;background:#c96a3f;color:#fff;text-decoration:none;
                        border-radius:100px;padding:6px 18px;font-size:12px;font-weight:600;">
                Confirmer ce créneau
              </a>
            </td>
          </tr>
          """.formatted(s[0], s[1]));
    }

    String reasonBlock = (reason != null && !reason.isBlank())
        ? "<p style='color:#8a7e78;font-size:13px;margin:12px 0 0;'><strong>Motif :</strong> " + reason + "</p>"
        : "";

    String body = """
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#f5f1ed;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f5f1ed;padding:32px 0;">
            <tr><td align="center">
              <table width="560" cellpadding="0" cellspacing="0"
                     style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#c96a3f,#e88f68);padding:32px 40px;text-align:center;">
                    <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700;">🌿 PeakWell</h1>
                    <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Health &amp; Wellness Platform</p>
                  </td>
                </tr>
                <!-- Badge -->
                <tr>
                  <td style="text-align:center;padding:24px 40px 0;">
                    <span style="display:inline-block;background:#c96a3f22;color:#c96a3f;border:1.5px solid #c96a3f44;
                                 border-radius:100px;padding:6px 20px;font-size:13px;font-weight:600;">
                      ❌ Rendez-vous refusé
                    </span>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:24px 40px 8px;">
                    <p style="margin:0 0 8px;color:#8a7e78;font-size:13px;">Bonjour, <strong>%s</strong></p>
                    <h2 style="margin:0 0 12px;color:#1e1a16;font-size:20px;font-weight:700;">Votre demande de rendez-vous a été refusée</h2>
                    <p style="margin:0;color:#5a5450;font-size:14px;line-height:1.7;">
                      Votre consultation avec <strong>%s</strong> prévue le <strong>%s</strong> n'a pas pu être confirmée.
                    </p>
                    %s
                  </td>
                </tr>
                <!-- Alternative slots -->
                <tr>
                  <td style="padding:16px 40px 32px;">
                    <p style="font-size:14px;font-weight:700;color:#2d2d2d;margin:0 0 12px;">
                      📅 Créneaux alternatifs proposés par votre nutritionniste :
                    </p>
                    <table width="100%%" cellpadding="0" cellspacing="0">
                      %s
                    </table>
                    <p style="margin:16px 0 0;color:#8a7e78;font-size:12px;">
                      Ces liens sont valables <strong>72 heures</strong>. Un seul créneau peut être confirmé.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background:#f9f6f3;padding:16px 40px;border-top:1px solid #ede8e3;text-align:center;">
                    <p style="margin:0;color:#b5aaa5;font-size:11px;">
                      Message automatique · PeakWell · Ne pas répondre à cet email
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """.formatted(patientName, doctorName, originalDate, reasonBlock, slotsHtml);

    send(to, subject, body);
  }

  public void sendSlotConfirmed(String to, String patientName, String doctorName, String date) {
    String subject = "✅ Nouveau rendez-vous confirmé — PeakWell";
    String body = template(patientName,
      "Votre rendez-vous est confirmé !",
      "Vous avez confirmé un nouveau créneau avec <strong>" + doctorName + "</strong> le <strong>" + date + "</strong>.<br><br>" +
      "Votre rendez-vous a été enregistré et sera prêt à votre arrivée.",
      "#7a9e7e", "✅ Confirmé"
    );
    send(to, subject, body);
  }

  public void sendWaitlistAdded(String to, String patientName, String doctorName, String date, int position) {
    String subject = "⏳ You're on the waitlist — PeakWell";
    String posLabel = position == 1 ? "You are <strong>#1 on the waitlist</strong>" : "You are <strong>#" + position + " on the waitlist</strong>";
    String body = template(patientName,
      "You've been added to the waitlist",
      "The slot you requested with <strong>" + doctorName + "</strong> on <strong>" + date + "</strong> is currently taken.<br><br>" +
      posLabel + " for this slot. If the current appointment is cancelled, yours will be <strong>automatically confirmed</strong> — no action needed.<br><br>" +
      "We'll notify you by email as soon as a spot opens up.",
      "#a78bfa", "⏳ On Waitlist"
    );
    send(to, subject, body);
  }

  public void sendWaitlistPromoted(String to, String patientName, String doctorName, String date) {
    String subject = "🎉 Great news — Your appointment is confirmed! — PeakWell";
    String body = template(patientName,
      "A spot opened up — you're confirmed!",
      "You were on the waitlist for a consultation with <strong>" + doctorName + "</strong>.<br><br>" +
      "A spot has become available and your appointment on <strong>" + date + "</strong> has been <strong>automatically confirmed</strong>.<br><br>" +
      "Please make sure you are available at the scheduled time.",
      "#7a9e7e", "✅ Confirmed from Waitlist"
    );
    send(to, subject, body);
  }

  public void sendReminder24h(String to, String patientName, String doctorName, String date) {
    String subject = "📅 Reminder: Appointment Tomorrow — PeakWell";
    String body = template(patientName,
      "Your appointment is tomorrow",
      "This is a reminder that you have a consultation with <strong>" + doctorName + "</strong> scheduled for <strong>" + date + "</strong>.<br><br>" +
      "Please prepare any questions or health updates you'd like to discuss.",
      "#4ab8f0", "📅 Tomorrow"
    );
    send(to, subject, body);
  }

  public void sendReminder1h(String to, String patientName, String doctorName, String date) {
    String subject = "⏰ Reminder: Appointment in 1 Hour — PeakWell";
    String body = template(patientName,
      "Your appointment starts in 1 hour",
      "Your consultation with <strong>" + doctorName + "</strong> is starting in <strong>1 hour</strong> at <strong>" + date + "</strong>.<br><br>" +
      "Please get ready and join on time.",
      "#e88f68", "⏰ Starting Soon"
    );
    send(to, subject, body);
  }

  // ── HTML template ────────────────────────────────────────────────────────

  private String template(String name, String heading, String body, String accentColor, String badge) {
    return """
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#f5f1ed;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f5f1ed;padding:32px 0;">
            <tr><td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#c96a3f,#e88f68);padding:32px 40px;text-align:center;">
                    <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">🌿 PeakWell</h1>
                    <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Health & Wellness Platform</p>
                  </td>
                </tr>
                <!-- Badge -->
                <tr>
                  <td style="text-align:center;padding:24px 40px 0;">
                    <span style="display:inline-block;background:%s22;color:%s;border:1.5px solid %s44;border-radius:100px;padding:6px 20px;font-size:13px;font-weight:600;">%s</span>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:24px 40px 32px;">
                    <p style="margin:0 0 8px;color:#8a7e78;font-size:13px;">Hello, <strong>%s</strong></p>
                    <h2 style="margin:0 0 16px;color:#1e1a16;font-size:20px;font-weight:700;">%s</h2>
                    <p style="margin:0;color:#5a5450;font-size:14px;line-height:1.7;">%s</p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background:#f9f6f3;padding:16px 40px;border-top:1px solid #ede8e3;text-align:center;">
                    <p style="margin:0;color:#b5aaa5;font-size:11px;">This is an automated message from PeakWell. Please do not reply to this email.</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """.formatted(accentColor, accentColor, accentColor, badge, name, heading, body);
  }
}
