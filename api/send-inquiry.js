export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    listingAddress, listingPrice, listingUrl,
    posterName, posterEmail,
    renterName, renterEmail, renterPhone,
    tourType, times, message,
  } = req.body || {}

  if (!listingAddress || !posterEmail || !renterName || !renterEmail) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const testRecipient = process.env.INQUIRY_TEST_RECIPIENT
  const brokerTo = testRecipient || posterEmail
  const renterTo = testRecipient || renterEmail

  const tourLabel = tourType === 'video' ? 'Video chat' : 'In person'
  const timesHtml = (times || []).length
    ? '<ul>' + times.map(t => '<li>' + t + '</li>').join('') + '</ul>'
    : '<p>No preferred times given.</p>'

  const brokerHtml = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#2C2420">
      <h2 style="color:#B44A36">New tour request on Cuna</h2>
      <p><strong>${renterName}</strong> has requested a tour for:</p>
      <div style="border:1px solid #E0D4C4;border-radius:10px;padding:16px;margin:16px 0">
        <p style="font-size:17px;font-weight:bold;margin:0">${listingAddress}</p>
        <p style="margin:6px 0 0">$${Number(listingPrice || 0).toLocaleString()}/mo</p>
      </div>
      <p><strong>Preferred tour:</strong> ${tourLabel}</p>
      <p><strong>Preferred times:</strong></p>
      ${timesHtml}
      ${message ? '<p><strong>Message:</strong> ' + message + '</p>' : ''}
      <div style="border-top:1px solid #E0D4C4;margin-top:16px;padding-top:16px">
        <p style="margin:0"><strong>Renter contact</strong></p>
        <p style="margin:4px 0 0">${renterName}<br/>${renterEmail}${renterPhone ? '<br/>' + renterPhone : ''}</p>
      </div>
      ${listingUrl ? '<p><a href="' + listingUrl + '" style="display:inline-block;background:#B44A36;color:#ffffff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold">View listing on Cuna</a></p>' : ''}
      <p style="color:#9B8E88;font-size:13px;margin-top:20px">Reply to this email to respond directly to the renter.</p>
    </div>`

  const renterHtml = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#2C2420">
      <h2 style="color:#B44A36">Your tour request was sent</h2>
      <p>Your request for <strong>${listingAddress}</strong> ($${Number(listingPrice || 0).toLocaleString()}/mo) was sent to ${posterName || 'the listing agent'}.</p>
      <p><strong>Your preferred tour:</strong> ${tourLabel}</p>
      ${timesHtml}
      <p>The agent will reach out to you by email. Replying to this email also goes directly to them.</p>
      <p style="color:#9B8E88;font-size:13px;margin-top:20px">Stay alert: never send money or personal financial information before independently verifying who you are dealing with. Cuna never processes payments.</p>
    </div>`

  try {
    const send = (payload) => fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const brokerResp = await send({
      from: 'Cuna <onboarding@resend.dev>',
      to: [brokerTo],
      reply_to: renterEmail,
      subject: renterName + ' requested a tour — ' + listingAddress,
      html: brokerHtml,
    })

    const renterResp = await send({
      from: 'Cuna <onboarding@resend.dev>',
      to: [renterTo],
      reply_to: posterEmail,
      subject: 'Your tour request was sent — ' + listingAddress,
      html: renterHtml,
    })

    if (!brokerResp.ok) {
      const err = await brokerResp.json().catch(() => ({}))
      console.error('Broker email failed:', err)
      return res.status(502).json({ error: 'Email send failed' })
    }
    if (!renterResp.ok) {
      console.error('Renter confirmation failed (broker email sent)')
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('send-inquiry error:', err)
    return res.status(500).json({ error: 'Email send failed' })
  }
}
