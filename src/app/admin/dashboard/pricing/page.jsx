'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ALL_CATALOG_ITEMS, PILOT_FLOOR_CENTS, PROMOTION_TYPES } from '@/lib/pricing-catalog';

async function api(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export default function AdminPricingPage() {
  const [markets, setMarkets] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marketForm, setMarketForm] = useState({ name: 'Peyton / Falcon', zipCodes: '80831,80831', notes: 'Pilot market' });
  const [promoForm, setPromoForm] = useState({ code: '', name: '', type: 'PERCENT', amount: 10 });
  const [approveForm, setApproveForm] = useState({});

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [m, p, q] = await Promise.all([
        api('/api/admin/pricing/markets'),
        api('/api/admin/pricing/promotions'),
        api('/api/admin/quotes?status=PENDING_ADMIN'),
      ]);
      setMarkets(m.markets || []);
      setPromotions(p.promotions || []);
      setQuotes(q.quotes || []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function createMarket(event) {
    event.preventDefault();
    try {
      await api('/api/admin/pricing/markets', {
        method: 'POST',
        body: JSON.stringify({
          name: marketForm.name,
          zipCodes: marketForm.zipCodes.split(/[\s,]+/).filter(Boolean),
          notes: marketForm.notes,
        }),
      });
      toast.success('Market created');
      refresh();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function setPilotPrices(marketId) {
    try {
      await api(`/api/admin/pricing/markets/${marketId}/prices`, {
        method: 'PUT',
        body: JSON.stringify({
          replace: true,
          prices: ALL_CATALOG_ITEMS.map((item) => ({
            planCode: item.id,
            amountCents: PILOT_FLOOR_CENTS[item.id],
          })),
        }),
      });
      toast.success('Pilot prices applied for this market');
      refresh();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function createPromotion(event) {
    event.preventDefault();
    try {
      await api('/api/admin/pricing/promotions', {
        method: 'POST',
        body: JSON.stringify({
          ...promoForm,
          amount: Number(promoForm.amount),
        }),
      });
      toast.success('Promotion created');
      setPromoForm({ code: '', name: '', type: 'PERCENT', amount: 10 });
      refresh();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function approveQuote(quoteId) {
    const amount = Number(approveForm[quoteId]);
    if (!amount || amount <= 0) {
      toast.error('Enter an approval amount in dollars');
      return;
    }
    try {
      await api(`/api/admin/quotes/${quoteId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'approve',
          amountCents: Math.round(amount * 100),
        }),
      });
      toast.success('Quote approved');
      refresh();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function rejectQuote(quoteId) {
    try {
      await api(`/api/admin/quotes/${quoteId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'reject', reason: 'Not a fit for pilot' }),
      });
      toast.success('Quote rejected');
      refresh();
    } catch (error) {
      toast.error(error.message);
    }
  }

  if (loading) {
    return <div className="p-6 text-slate-600">Loading pricing…</div>;
  }

  return (
    <div className="space-y-10 p-2">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Pricing</h1>
        <p className="text-slate-600 mt-1">
          Set market prices and promotions without touching live subscriptions. Unusual jobs stay in the quote queue until an admin approves a profitable amount.
        </p>
        <p className="text-sm text-slate-500 mt-2">
          Pilot floors: monthly $79/$89/$99 · one-time from $79/$99/$119 · catch-up $49
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Markets</h2>
        <form onSubmit={createMarket} className="flex flex-wrap gap-2 items-end">
          <label className="text-sm">
            Name
            <input className="block mt-1 border rounded px-2 py-1" value={marketForm.name} onChange={(e) => setMarketForm({ ...marketForm, name: e.target.value })} />
          </label>
          <label className="text-sm">
            ZIP codes
            <input className="block mt-1 border rounded px-2 py-1 w-48" value={marketForm.zipCodes} onChange={(e) => setMarketForm({ ...marketForm, zipCodes: e.target.value })} />
          </label>
          <button type="submit" className="rounded bg-slate-900 text-white px-3 py-2 text-sm">Add market</button>
        </form>
        <ul className="space-y-3">
          {markets.map((market) => (
            <li key={market.id} className="border rounded p-4 bg-white">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-medium">{market.name} {!market.active && <span className="text-amber-600">(inactive)</span>}</p>
                  <p className="text-sm text-slate-500">ZIPs: {(market.zipCodes || []).join(', ')}</p>
                </div>
                <button type="button" className="text-sm underline" onClick={() => setPilotPrices(market.id)}>
                  Apply pilot prices
                </button>
              </div>
              {market.prices?.length > 0 && (
                <ul className="mt-3 text-sm grid gap-1 md:grid-cols-2">
                  {market.prices.slice(0, 12).map((price) => (
                    <li key={price.id}>{price.planCode}: ${(price.amountCents / 100).toFixed(2)}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
          {markets.length === 0 && <li className="text-sm text-slate-500">No markets yet.</li>}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Promotions</h2>
        <form onSubmit={createPromotion} className="flex flex-wrap gap-2 items-end">
          <label className="text-sm">
            Code
            <input className="block mt-1 border rounded px-2 py-1" value={promoForm.code} onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value })} required />
          </label>
          <label className="text-sm">
            Name
            <input className="block mt-1 border rounded px-2 py-1" value={promoForm.name} onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })} />
          </label>
          <label className="text-sm">
            Type
            <select className="block mt-1 border rounded px-2 py-1" value={promoForm.type} onChange={(e) => setPromoForm({ ...promoForm, type: e.target.value })}>
              {Object.values(PROMOTION_TYPES).map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <label className="text-sm">
            Amount
            <input type="number" className="block mt-1 border rounded px-2 py-1 w-24" value={promoForm.amount} onChange={(e) => setPromoForm({ ...promoForm, amount: e.target.value })} />
          </label>
          <button type="submit" className="rounded bg-slate-900 text-white px-3 py-2 text-sm">Add promotion</button>
        </form>
        <ul className="space-y-2">
          {promotions.map((promo) => (
            <li key={promo.id} className="border rounded p-3 bg-white text-sm">
              <span className="font-mono font-medium">{promo.code}</span> — {promo.name} ({promo.type}
              {promo.type !== 'FREE_CATCHUP' ? ` ${promo.amount}` : ''})
              {!promo.active && <span className="text-amber-600"> inactive</span>}
            </li>
          ))}
          {promotions.length === 0 && <li className="text-sm text-slate-500">No promotions yet.</li>}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Pending quotes</h2>
        <ul className="space-y-3">
          {quotes.map((quote) => (
            <li key={quote.id} className="border rounded p-4 bg-white">
              <p className="font-medium">{quote.contactName || quote.contactEmail} · {quote.dogCount} dogs · {quote.kind}</p>
              <p className="text-sm text-slate-500">{quote.zipCode} {quote.city} {quote.state}</p>
              {quote.notes && <p className="text-sm mt-1">{quote.notes}</p>}
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Approve $"
                  className="border rounded px-2 py-1 w-28 text-sm"
                  value={approveForm[quote.id] || ''}
                  onChange={(e) => setApproveForm({ ...approveForm, [quote.id]: e.target.value })}
                />
                <button type="button" className="rounded bg-emerald-700 text-white px-3 py-1.5 text-sm" onClick={() => approveQuote(quote.id)}>
                  Approve
                </button>
                <button type="button" className="rounded border px-3 py-1.5 text-sm" onClick={() => rejectQuote(quote.id)}>
                  Reject
                </button>
              </div>
            </li>
          ))}
          {quotes.length === 0 && <li className="text-sm text-slate-500">No pending quotes.</li>}
        </ul>
      </section>
    </div>
  );
}
