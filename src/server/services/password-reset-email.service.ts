import nodemailer from "nodemailer";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function smtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim() && process.env.SMTP_HOST?.trim()
  );
}

function createTransporter() {
  const port = Number.parseInt(process.env.SMTP_PORT || "587", 10);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number.isFinite(port) ? port : 587,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || ""
    }
  });
}

function resolveAppUrl(): string {
  const configured = process.env.APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return "http://localhost:3000";
}

export type PasswordResetEmailParams = {
  to: string;
  nombre: string;
  apellido: string;
  resetUrl: string;
};

export async function sendPasswordResetEmail(params: PasswordResetEmailParams): Promise<boolean> {
  const { to, nombre, apellido, resetUrl } = params;
  const dest = to?.trim();
  const nombreSafe = escapeHtml(nombre.trim());
  const apellidoSafe = escapeHtml(apellido.trim());
  const resetUrlSafe = escapeHtml(resetUrl);

  if (!dest) {
    console.warn("[password-reset-email] Sin correo destino; no se envia enlace");
    return false;
  }

  if (!smtpConfigured()) {
    console.warn(
      "[password-reset-email] SMTP no configurado (SMTP_HOST, SMTP_USER, SMTP_PASS); no se envia correo"
    );
    return false;
  }

  try {
    const transporter = createTransporter();
    const fromAddr = process.env.SMTP_USER!.trim();

    await transporter.sendMail({
      from: `"Software de Asistencia para Aprendices" <${fromAddr}>`,
      to: dest,
      subject: "Restablecer tu contraseña — SAA",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family:Segoe UI,Tahoma,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;background:#f4f4f4;">
  <div style="background:#fff;padding:30px;border-radius:10px;box-shadow:0 0 20px rgba(0,0,0,0.08);">
    <div style="text-align:center;background:linear-gradient(135deg,#2f80ed 0%,#256fce 100%);color:#fff;padding:20px;border-radius:10px;margin-bottom:24px;">
      <h1 style="margin:0;font-size:24px;">Software de Asistencia para Aprendices</h1>
      <p style="margin:8px 0 0;font-size:14px;opacity:0.95;">Recuperacion de contraseña</p>
    </div>
    <p>Hola <strong>${nombreSafe} ${apellidoSafe}</strong>,</p>
    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. Si fuiste tu, usa el boton siguiente. El enlace vence en 1 hora.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${resetUrlSafe}" style="display:inline-block;background:#2f80ed;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;">Restablecer contraseña</a>
    </div>
    <p style="font-size:14px;color:#555;">Si el boton no funciona, copia y pega este enlace en tu navegador:</p>
    <p style="font-size:13px;word-break:break-all;background:#f8f9fa;padding:12px;border-radius:6px;">${resetUrlSafe}</p>
    <p style="font-size:14px;color:#666;margin-top:24px;">Si no solicitaste este cambio, ignora este correo. Tu contraseña no se modificara.</p>
  </div>
</body>
</html>`
    });

    return true;
  } catch (error) {
    console.error("[password-reset-email] Error enviando correo:", error);
    return false;
  }
}

export function buildPasswordResetUrl(token: string): string {
  const base = resolveAppUrl();
  return `${base}/recuperar-contrasena/restablecer?token=${encodeURIComponent(token)}`;
}
