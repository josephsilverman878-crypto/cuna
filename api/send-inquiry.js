export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    listingAddress, listingPrice, listingUrl,
    posterName, posterEmail,
    renterName, renterEmail, renterPhone,
    tourType, times, message,
    // Optional, and only present when the renter's privacy toggle allows it.
    moveInDate, hasPets, petDetails, creditScoreRange,
  } = req.body || {}

  if (!listingAddress || !posterEmail || !renterName || !renterEmail) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // These values land inside an HTML email, so escape anything user-controlled.
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))

  const testRecipient = process.env.INQUIRY_TEST_RECIPIENT
  const brokerTo = testRecipient || posterEmail
  const renterTo = testRecipient || renterEmail

  const tourLabel = tourType === 'video' ? 'Video chat' : 'In person'
  const timesHtml = (times || []).length
    ? '<ul>' + times.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>'
    : '<p>No preferred times given.</p>'

  // "Renter details" — built only from fields the renter chose to share.
  // Anything absent is omitted entirely; no empty rows, no "N/A".
  const detailRows = []
  if (moveInDate) {
    detailRows.push(['Target move-in', esc(moveInDate)])
  }
  if (hasPets !== undefined && hasPets !== null) {
    detailRows.push(['Pets', hasPets
      ? 'Has pets' + (petDetails ? ' — ' + esc(petDetails) : '')
      : 'No pets'])
  }
  if (creditScoreRange) {
    detailRows.push(['Credit score', esc(String(creditScoreRange).replace('_', '-'))])
  }

  const detailsHtml = detailRows.length
    ? `<div style="border-top:1px solid #E0D4C4;margin-top:16px;padding-top:16px">
        <p style="margin:0"><strong>Renter details</strong></p>
        ${detailRows.map(([k, v]) => `<p style="margin:4px 0 0">${k}: ${v}</p>`).join('')}
        <p style="color:#9B8E88;font-size:12px;margin:10px 0 0">Shared voluntarily by the renter.</p>
      </div>`
    : ''

  const brokerHtml = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#2C2420">
      <h2 style="color:#B44A36">New tour request on Cuna</h2>
      <p><strong>${esc(renterName)}</strong> has requested a tour for:</p>
      <div style="border:1px solid #E0D4C4;border-radius:10px;padding:16px;margin:16px 0">
        <p style="font-size:17px;font-weight:bold;margin:0">${esc(listingAddress)}</p>
        <p style="margin:6px 0 0">$${Number(listingPrice || 0).toLocaleString()}/mo</p>
      </div>
      <p><strong>Preferred tour:</strong> ${tourLabel}</p>
      <p><strong>Preferred times:</strong></p>
      ${timesHtml}
      ${message ? '<p><strong>Message:</strong> ' + esc(message) + '</p>' : ''}
      <div style="border-top:1px solid #E0D4C4;margin-top:16px;padding-top:16px">
        <p style="margin:0"><strong>Renter contact</strong></p>
        <p style="margin:4px 0 0">${esc(renterName)}<br/>${esc(renterEmail)}${renterPhone ? '<br/>' + esc(renterPhone) : ''}</p>
      </div>
      ${detailsHtml}
      ${listingUrl ? '<p><a href="' + listingUrl + '" style="display:inline-block;background:#B44A36;color:#ffffff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold">View listing on Cuna</a></p>' : ''}
      <p style="color:#9B8E88;font-size:13px;margin-top:20px">Reply to this email to respond directly to the renter.</p>
    </div>`

  const renterHtml = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#2C2420">
      <h2 style="color:#B44A36">Your tour request was sent</h2>
      <p>Your request for <strong>${esc(listingAddress)}</strong> ($${Number(listingPrice || 0).toLocaleString()}/mo) was sent to ${esc(posterName || 'the listing agent')}.</p>
      <p><strong>Your preferred tour:</strong> ${tourLabel}</p>
      ${timesHtml}
      ${listingUrl ? '<p><a href="' + listingUrl + '" style="display:inline-block;background:#B44A36;color:#ffffff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold">View listing on Cuna</a></p>' : ''}
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
