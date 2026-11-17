import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { adminAiUsage, aiHealth, aiRequest } from '../lib/ai'
import AiLabel from './AiLabel'

// /admin → AI: how much Cuna's assistant is used and what it costs.
// Reads aggregates only (admin_ai_usage, 49-ai.sql): requests and estimated
// cost per day and per feature, cache hit rate, fair-housing regenerations.
// The usage table holds no message content, so none can appear here.

const FEATURE_LABELS = {
  selftest: 'Test question',
  guide_parse: 'Guide: reading the request',
  guide: 'Neighborhood guide',
  writeup: 'Neighborhood write-ups',
  draft: 'Listing description drafts',
  search_parse: 'Plain-English search',
  listing_qa: 'Ask about a listing',
  recommend: 'Listing recommendations',
}

function usd(n) {
  const v = Number(n) || 0
  return '$' + (v >= 100 ? v.toFixed(0) : v >= 0.1 ? v.toFixed(2) : v.toFixed(3))
}

function dayLabel(iso) {
  const [y, m, d] = String(iso).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function sum(rows, key) {
  return rows.reduce((t, r) => t + (Number(r[key]) || 0), 0)
}

function groupBy(rows, key) {
  const map = new Map()
  for (const r of rows) {
    const k = r[key]
    if (!map.has(k)) map.set(k, [])
    map.get(k).push(r)
  }
  return [...map.entries()].map(([k, list]) => ({
    key: k,
    requests: sum(list, 'requests'), model_calls: sum(list, 'model_calls'), cache_hits: sum(list, 'cache_hits'),
    limited: sum(list, 'limited'), errors: sum(list, 'errors'), fh_regenerations: sum(list, 'fh_regenerations'),
    fh_fallbacks: sum(list, 'fh_fallbacks'), cost_usd: sum(list, 'cost_usd'),
  }))
}

const card = {
  background: 'var(--white)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', boxShadow: 'var(--shadow-sm)',
}
const th = { textAlign: 'right', fontSize: '11px', fontWeight: 600, color: 'var(--warm-gray)', padding: '6px 0 6px 6px', whiteSpace: 'nowrap' }
const td = { textAlign: 'right', fontSize: '13px', padding: '8px 0 8px 6px', borderTop: '1px solid var(--sand-dark)', whiteSpace: 'nowrap' }

export default function AdminAi() {
  const [days, setDays] = useState(14)
  const [rows, setRows] = useState(null)
  const [missing, setMissing] = useState(false)
  const [health, setHealth] = useState(null)
  const [checking, setChecking] = useState(false)
  const [testing, setTesting] = useState(false)
  const [test, setTest] = useState(null)

  useEffect(() => {
    let cancelled = false
    setRows(null)
    adminAiUsage(days).then(({ data, error }) => {
      if (cancelled) return
      if (error) {
        // PGRST202 / 42883: the function is not in the database yet.
        const notApplied = error.code === 'PGRST202' || error.code === '42883'
        setMissing(notApplied)
        if (!notApplied) { console.error('AI usage failed:', error); toast.error('Could not load AI usage') }
      } else {
        setMissing(false)
      }
      setRows(data || [])
    })
    return () => { cancelled = true }
  }, [days])

  const totals = useMemo(() => {
    const r = rows || []
    const requests = sum(r, 'requests')
    const hits = sum(r, 'cache_hits')
    return {
      requests, hits, cost: sum(r, 'cost_usd'), limited: sum(r, 'limited'), errors: sum(r, 'errors'),
      regen: sum(r, 'fh_regenerations'), fallbacks: sum(r, 'fh_fallbacks'),
      hitRate: requests > 0 ? Math.round((hits / requests) * 100) : null,
    }
  }, [rows])
  const byDay = useMemo(() => groupBy(rows || [], 'day'), [rows])
  const byFeature = useMemo(() => groupBy(rows || [], 'feature').sort((a, b) => b.requests - a.requests), [rows])

  async function runHealth() {
    setChecking(true)
    setTest(null)
    const h = await aiHealth()
    setChecking(false)
    setHealth(h)
  }

  async function runTest() {
    setTesting(true)
    const r = await aiRequest('selftest')
    setTesting(false)
    setTest(r)
    if (r.ok) toast.success('The assistant answered')
  }

  const pill = (on) => ({
    padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 500,
    background: on ? 'var(--terracotta)' : 'var(--white)', color: on ? 'white' : 'var(--warm-gray)',
    border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
  })
  const line = (label, value, good) => (
    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '13px', padding: '6px 0', borderTop: '1px solid var(--sand-dark)' }}>
      <span style={{ color: 'var(--warm-gray)' }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: 'right', color: good === false ? 'var(--terracotta-dark)' : 'var(--charcoal)' }}>{value}</span>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[7, 14, 30].map(d => (
          <button key={d} onClick={() => setDays(d)} style={pill(days === d)}>{d} days</button>
        ))}
      </div>
      <p style={{ fontSize: '12px', color: 'var(--warm-gray)', lineHeight: 1.5, marginBottom: '16px' }}>
        Counts, tokens and a cost estimate only. Cuna does not keep what people type to the assistant or what it answers. Days are New York days. The cost is an estimate from the published token prices; the provider's invoice is the real figure.
      </p>

      {rows === null ? (
        <div className="center" style={{ padding: '40px' }}><div className="spinner" /></div>
      ) : missing ? (
        <div style={{ ...card, fontSize: '13px', lineHeight: 1.5 }}>
          The AI tables are not in the database yet. Run <strong>49-ai.sql</strong> in the Supabase SQL editor, then reload this page.
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            {[
              ['Requests', totals.requests.toLocaleString('en-US')],
              ['Estimated cost', usd(totals.cost)],
              ['Cache hit rate', totals.hitRate === null ? 'No requests yet' : totals.hitRate + '%'],
              ['Fair-housing regenerations', `${totals.regen}${totals.fallbacks ? ` (${totals.fallbacks} fell back)` : ''}`],
            ].map(([label, value]) => (
              <div key={label} style={card}>
                <div style={{ fontSize: '11px', color: 'var(--warm-gray)', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600, lineHeight: 1.2 }}>{value}</div>
              </div>
            ))}
          </div>
          {(totals.limited > 0 || totals.errors > 0) && (
            <p style={{ fontSize: '12px', color: 'var(--warm-gray)', marginBottom: '16px' }}>
              {totals.limited} turned away at a daily limit · {totals.errors} failed
            </p>
          )}

          {rows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--warm-gray)', fontSize: '14px' }}>
              No assistant requests in the last {days} days.
            </div>
          ) : (
            <>
              <div style={{ ...card, marginBottom: '16px', overflowX: 'auto' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>By feature</h2>
                <p style={{ fontSize: '11px', color: 'var(--warm-gray)', lineHeight: 1.5, marginBottom: '4px' }}>
                  Asked = requests. Cached = answered from a stored answer, no model call. Redone = rewritten after the fair-housing check. Cost is an estimate.
                </p>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ ...th, textAlign: 'left', paddingLeft: 0 }}>Feature</th>
                      <th style={th}>Asked</th>
                      <th style={th}>Cached</th>
                      <th style={th} title="Fair-housing regenerations">Redone</th>
                      <th style={th}>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byFeature.map(f => (
                      <tr key={f.key}>
                        <td style={{ ...td, textAlign: 'left', paddingLeft: 0, whiteSpace: 'normal' }}>{FEATURE_LABELS[f.key] || f.key}</td>
                        <td style={td}>{f.requests}</td>
                        <td style={td}>{f.cache_hits}</td>
                        <td style={td}>{f.fh_regenerations}</td>
                        <td style={td}>{usd(f.cost_usd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ ...card, marginBottom: '16px', overflowX: 'auto' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>By day</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ ...th, textAlign: 'left', paddingLeft: 0 }}>Day</th>
                      <th style={th}>Asked</th>
                      <th style={th}>Cached</th>
                      <th style={th}>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byDay.map(d => (
                      <tr key={d.key}>
                        <td style={{ ...td, textAlign: 'left', paddingLeft: 0 }}>{dayLabel(d.key)}</td>
                        <td style={td}>{d.requests}</td>
                        <td style={td}>{d.cache_hits}</td>
                        <td style={td}>{usd(d.cost_usd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      <div style={{ ...card, marginTop: '16px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>Health check</h2>
        <p style={{ fontSize: '12px', color: 'var(--warm-gray)', lineHeight: 1.5, marginBottom: '12px' }}>
          Confirms the model key works and the tables are reachable. The key is never shown. The check itself costs nothing; the test question uses one request from today's limit.
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: health ? '12px' : 0 }}>
          <button className="btn btn-primary" onClick={runHealth} disabled={checking} style={{ padding: '10px 16px', fontSize: '13px' }}>
            {checking ? 'Checking…' : 'Run health check'}
          </button>
          {health?.ok && health.ai_enabled && (
            <button className="btn btn-secondary" onClick={runTest} disabled={testing} style={{ padding: '10px 16px', fontSize: '13px' }}>
              {testing ? 'Asking…' : 'Ask a test question'}
            </button>
          )}
        </div>
        {health && (
          <div>
            {line('Assistant switched on (server)', health.ai_enabled ? 'Yes' : 'No', health.ai_enabled)}
            {'key' in health ? (
              <>
                {line('Model key', health.key === 'present' ? 'Works' : health.key === 'rejected' ? 'Rejected by the provider' : 'Missing', health.key === 'present')}
                {Object.entries(health.models || {}).map(([tier, v]) => line(tier === 'fast' ? 'Fast model' : 'Smart model', v === 'ok' ? 'Reachable' : v, v === 'ok'))}
                {line('Limits, cache and usage log', health.store === 'service' ? (health.store_tables === 'ok' ? 'Working' : health.store_tables) : health.store === 'memory' ? 'In memory only (no service key on this deployment)' : 'Missing service key', health.store === 'service' && health.store_tables === 'ok')}
                {health.limits && line('Daily limits', `${health.limits.userPerDay} signed in · ${health.limits.ipPerDay} signed out · ${health.limits.globalPerDay} overall`)}
                {line('Web search', health.web_search ? 'On' : 'Off')}
                {line('Assistant actions', health.actions ? 'On' : 'Off')}
                {line('Deployment', health.environment)}
              </>
            ) : (
              line('Details', health.error === 'unreachable' ? 'The check could not be reached' : 'Sign in as an admin to see them', false)
            )}
          </div>
        )}
        {test && (
          <div style={{ marginTop: '12px', fontSize: '13px', lineHeight: 1.5 }}>
            {test.ok ? (
              <>
                <div><strong>Answer:</strong> {test.output?.count} stations; first is {test.output?.first || 'none'}.</div>
                <div style={{ color: 'var(--warm-gray)' }}>{test.output?.note}</div>
                {test.fallback && <div style={{ color: 'var(--terracotta-dark)' }}>The neutral fallback was used.</div>}
              </>
            ) : (
              <div style={{ color: 'var(--terracotta-dark)' }}>{test.message || 'The test question failed.'}</div>
            )}
          </div>
        )}
      </div>
      <AiLabel style={{ marginTop: '16px' }} />
    </div>
  )
}
