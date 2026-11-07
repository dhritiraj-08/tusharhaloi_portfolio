/* Vercel serverless function — POST /api/contact
   Sends (1) the enquiry to Tushar and (2) a thank-you / confirmation to the client, through Gmail SMTP.

   Environment variables (set them in Vercel → Project → Settings → Environment Variables):
     GMAIL_USER          the Gmail address that sends the mails            e.g. tusharkalitahaloi@gmail.com
     GMAIL_APP_PASSWORD  a Google "App password" (16 letters) — NOT the normal Gmail password
     CONTACT_TO          (optional) where enquiries are delivered — defaults to GMAIL_USER
*/
const nodemailer = require('nodemailer');

const OWNER = 'Tushar Haloi';
const INSTAGRAM = 'https://www.instagram.com/tusharhaloi_/';
const hits = new Map();                       // tiny per-instance rate limit (best effort)

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const line = (s, max) => String(s == null ? '' : s).replace(/[\r\n]+/g, ' ').trim().slice(0, max);   // single-line: no header injection
const EMAIL = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;

function ownerMail(d) {
  const text = `New call sheet from the portfolio\n\nName: ${d.name}\nEmail: ${d.email}\nProject type: ${d.type}\n\nBrief:\n${d.msg}\n\n— Reply to this email to answer ${d.name} directly.`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;background:#0B0A09;padding:28px;color:#EFE9DC">
  <div style="max-width:560px;margin:auto;border:1px solid #3a3731;padding:26px">
    <p style="margin:0 0 4px;font:12px monospace;letter-spacing:.2em;color:#F0B23A">CALL SHEET · NEW ENQUIRY</p>
    <h2 style="margin:0 0 18px;font-size:26px;text-transform:uppercase">${esc(d.name)}</h2>
    <p style="margin:0 0 6px"><b style="color:#E2331F">Email</b> &nbsp;<a style="color:#EFE9DC" href="mailto:${esc(d.email)}">${esc(d.email)}</a></p>
    <p style="margin:0 0 18px"><b style="color:#E2331F">Project</b> &nbsp;${esc(d.type)}</p>
    <p style="margin:0 0 6px;font:12px monospace;letter-spacing:.18em;color:#9d978a">THE BRIEF</p>
    <p style="margin:0;white-space:pre-wrap;line-height:1.6">${esc(d.msg)}</p>
  </div>
  <p style="text-align:center;font:11px monospace;color:#8a8478;margin-top:14px">Hit reply to answer ${esc(d.name)} directly.</p>
</div>`;
  return { subject: `New enquiry — ${d.type} — ${d.name}`, text, html };
}

function clientMail(d) {
  const text = `Hi ${d.name},\n\nThanks for reaching out — your message has landed and I'll get back to you very soon.\n\nHere's a copy of what you sent:\n\nProject type: ${d.type}\n${d.msg}\n\n— ${OWNER}\nVideo Editor\n${INSTAGRAM}`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;background:#0B0A09;padding:28px;color:#EFE9DC">
  <div style="max-width:560px;margin:auto;border:1px solid #3a3731;padding:30px">
    <p style="margin:0 0 6px;font:12px monospace;letter-spacing:.22em;color:#E2331F">● REC &nbsp;·&nbsp; MESSAGE RECEIVED</p>
    <h1 style="margin:0 0 16px;font-size:34px;line-height:1.05;text-transform:uppercase">Thanks, ${esc(d.name.split(' ')[0])}.</h1>
    <p style="margin:0 0 14px;line-height:1.65;font-size:16px">Your call sheet has landed in my inbox. I'll read it properly and <b>get back to you very soon</b>.</p>
    <p style="margin:22px 0 6px;font:12px monospace;letter-spacing:.18em;color:#9d978a">A COPY OF WHAT YOU SENT</p>
    <div style="border-left:3px solid #F0B23A;padding:4px 0 4px 14px;color:#cfc9bb">
      <p style="margin:0 0 6px;font-size:13px"><b>Project type:</b> ${esc(d.type)}</p>
      <p style="margin:0;white-space:pre-wrap;line-height:1.6;font-size:14px">${esc(d.msg)}</p>
    </div>
    <p style="margin:26px 0 4px;font-size:16px">— ${OWNER}</p>
    <p style="margin:0;font:12px monospace;letter-spacing:.14em;color:#9d978a">VIDEO EDITOR · <a style="color:#F0B23A" href="${INSTAGRAM}">@tusharhaloi_</a></p>
  </div>
  <p style="text-align:center;font:11px monospace;color:#8a8478;margin-top:14px">You're getting this because you filled in the contact form on Tushar Haloi's portfolio.</p>
</div>`;
  return { subject: `Thanks for contacting me, ${d.name.split(' ')[0]} — ${OWNER}`, text, html };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false, error: 'Method not allowed' }); }

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  b = b || {};

  if (b.website) return res.status(200).json({ ok: true });            // honeypot: pretend success to bots

  const ip = String((req.headers['x-forwarded-for'] || '').split(',')[0] || 'x').trim();
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  if (recent.length >= 5) return res.status(429).json({ ok: false, error: 'Too many messages — please try again in a few minutes.' });
  hits.set(ip, recent.concat(now));

  const d = { name: line(b.name, 100), email: line(b.email, 200), type: line(b.type, 80) || 'General', msg: String(b.msg || '').replace(/\r/g, '').trim().slice(0, 5000) };
  if (!d.name || !EMAIL.test(d.email) || d.msg.length < 3) return res.status(400).json({ ok: false, error: 'Please fill in your name, a valid email and a message.' });

  const user = process.env.GMAIL_USER, pass = process.env.GMAIL_APP_PASSWORD;
  const tx = module.exports._transport || (user && pass ? nodemailer.createTransport({ service: 'gmail', auth: { user, pass } }) : null);
  if (!tx) return res.status(500).json({ ok: false, error: 'Email is not configured on the server yet.' });
  const to = process.env.CONTACT_TO || user;
  const from = `"${OWNER}" <${user}>`;

  try {
    const o = ownerMail(d);
    const safe = d.name.replace(/["<>\\]/g, '');
    await tx.sendMail({ from: `"${safe} via portfolio" <${user}>`, to, replyTo: `"${safe}" <${d.email}>`, subject: o.subject, text: o.text, html: o.html });
  } catch (e) {
    console.error('owner mail failed', e && e.message);
    return res.status(502).json({ ok: false, error: 'Could not send the message right now.' });
  }
  try {                                                                  // the confirmation is a nice-to-have: never fail the request over it
    const c = clientMail(d);
    await tx.sendMail({ from, to: d.email, replyTo: to, subject: c.subject, text: c.text, html: c.html });
  } catch (e) { console.error('client mail failed', e && e.message); }

  return res.status(200).json({ ok: true });
};
