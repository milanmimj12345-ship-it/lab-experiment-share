const express = require('express');
const router = express.Router();

router.post('/email', async (req, res) => {
  const { email, fileUrl, fileName, message } = req.body;
  if (!email || !fileUrl || !fileName) {
    return res.status(400).json({ success: false, message: 'email, fileUrl, and fileName are required' });
  }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Lab Experiment Share <onboarding@resend.dev>',
        to: [email],
        subject: `Lab File Shared: ${fileName}`,
        html: `<div style="font-family:Arial;max-width:600px;margin:0 auto;background:#111;color:#fff;padding:40px;border-radius:16px;">
          <h2 style="color:#ff6b00;margin-bottom:4px;">Lab Experiment Share</h2>
          <p style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin-bottom:32px;">File Delivery</p>
          <div style="background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:24px;margin-bottom:24px;">
            <p style="color:#666;font-size:11px;text-transform:uppercase;margin-bottom:8px;">File</p>
            <p style="font-weight:bold;font-size:18px;margin:0;">${fileName}</p>
          </div>
          ${message ? `<div style="background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:24px;margin-bottom:24px;"><p style="color:#666;font-size:11px;text-transform:uppercase;margin-bottom:8px;">Message</p><p style="margin:0;">${message}</p></div>` : ''}
          <a href="${fileUrl}" style="display:block;background:#ff6b00;color:#000;text-align:center;padding:16px;border-radius:12px;font-weight:bold;text-decoration:none;text-transform:uppercase;letter-spacing:2px;">Download File</a>
          <p style="color:#444;font-size:11px;text-align:center;margin-top:32px;">Sent via Lab Experiment Share Platform</p>
        </div>`,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Resend error:', data);
      return res.status(500).json({ success: false, message: data.message || 'Email failed' });
    }
    res.json({ success: true, message: 'Email sent successfully!' });
  } catch (err) {
    console.error('Email error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
