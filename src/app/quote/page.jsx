'use client';

import { useState } from 'react';
import Link from 'next/link';
import { QUOTE_MIN_DOGS } from '@/lib/pricing-catalog';

export default function QuoteRequestPage() {
  const [form, setForm] = useState({
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    dogCount: String(QUOTE_MIN_DOGS),
    zipCode: '',
    addressLine: '',
    city: '',
    state: 'CO',
    kind: 'ONE_TIME',
    unusualYard: true,
    unusualAccess: false,
    remoteAddress: false,
    notes: '',
  });
  const [status, setStatus] = useState({ type: null, message: null, quoteId: null });
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatus({ type: null, message: null, quoteId: null });
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...form,
          dogCount: Number(form.dogCount),
          forceQuote: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ type: 'error', message: data.error || 'Could not submit quote request' });
        return;
      }
      setStatus({
        type: 'success',
        message: data.message,
        quoteId: data.quoteId,
      });
    } catch (error) {
      setStatus({ type: 'error', message: 'Network error — please try again' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-xl">
        <p className="text-sm text-slate-500 mb-2">
          <Link href="/pricing" className="underline">← Back to pricing</Link>
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 mb-2">Request a quote</h1>
        <p className="text-slate-600 mb-8">
          Serving Colorado Springs and Falcon, Colorado. {QUOTE_MIN_DOGS}+ dogs, large or
          neglected yards, unusual access, and remote addresses need a custom quote — including
          catch-up cleanups outside standard plans. An admin reviews every request.
        </p>

        {status.type === 'success' ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
            <p className="font-medium mb-2">Quote request received</p>
            <p className="text-sm mb-2">{status.message}</p>
            {status.quoteId && (
              <p className="text-xs text-emerald-800">Reference: {status.quoteId}</p>
            )}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Name</span>
              <input
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={form.contactName}
                onChange={(e) => update('contactName', e.target.value)}
                required
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Email</span>
              <input
                type="email"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={form.contactEmail}
                onChange={(e) => update('contactEmail', e.target.value)}
                required
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Phone</span>
              <input
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={form.contactPhone}
                onChange={(e) => update('contactPhone', e.target.value)}
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Dogs</span>
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                  value={form.dogCount}
                  onChange={(e) => update('dogCount', e.target.value)}
                  required
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Service type</span>
                <select
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                  value={form.kind}
                  onChange={(e) => update('kind', e.target.value)}
                >
                  <option value="ONE_TIME">One-time cleanup</option>
                  <option value="SUBSCRIPTION">Weekly club</option>
                </select>
              </label>
            </div>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Street</span>
              <input
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={form.addressLine}
                onChange={(e) => update('addressLine', e.target.value)}
              />
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label className="block text-sm col-span-1">
                <span className="font-medium text-slate-700">City</span>
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-slate-700">State</span>
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                  value={form.state}
                  onChange={(e) => update('state', e.target.value)}
                  maxLength={2}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-slate-700">ZIP</span>
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                  value={form.zipCode}
                  onChange={(e) => update('zipCode', e.target.value)}
                  required
                />
              </label>
            </div>
            <fieldset className="space-y-2 text-sm">
              <legend className="font-medium text-slate-700">Why a quote?</legend>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.unusualYard} onChange={(e) => update('unusualYard', e.target.checked)} />
                Large or neglected yard
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.unusualAccess} onChange={(e) => update('unusualAccess', e.target.checked)} />
                Unusual access
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.remoteAddress} onChange={(e) => update('remoteAddress', e.target.checked)} />
                Remote address
              </label>
            </fieldset>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Notes</span>
              <textarea
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                rows={4}
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
              />
            </label>
            {status.type === 'error' && (
              <p className="text-sm text-red-600">{status.message}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded bg-slate-900 px-4 py-2.5 text-white font-medium disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Submit quote request'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
