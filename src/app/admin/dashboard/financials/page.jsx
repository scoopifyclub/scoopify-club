'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { format, parseISO, subDays } from 'date-fns';
import { AlertTriangle, Loader2, RefreshCw, Search, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DateRangePicker } from '@/components/ui/date-range-picker';

export const dynamic = 'force-dynamic';

function toYmd(date) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return format(d, 'yyyy-MM-dd');
}

function money(value) {
  const n = Number(value || 0);
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function payoutStatusBadge(status) {
  switch (String(status || '').toUpperCase()) {
    case 'PAID':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
    case 'PENDING':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
    case 'HELD':
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Held</Badge>;
    case 'PROCESSING':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Processing</Badge>;
    case 'VOID':
      return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Void</Badge>;
    case 'FAILED':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>;
    default:
      return <Badge variant="outline">{status || '—'}</Badge>;
  }
}

function formatWhen(value) {
  if (!value) return '—';
  try {
    const d = typeof value === 'string' ? parseISO(value) : new Date(value);
    return format(d, 'MMM d, yyyy');
  } catch {
    return '—';
  }
}

export default function AdminFinancialsPage() {
  const { user, status } = useAuth({ required: true, role: 'ADMIN', redirectTo: '/admin/login' });
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 27),
    to: new Date(),
  });
  const [payoutStatus, setPayoutStatus] = useState('ALL');
  const [pricingBasis, setPricingBasis] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [loading, setLoading] = useState(true);
  const [resolvingHoldId, setResolvingHoldId] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [jobs, setJobs] = useState(null);
  const [issues, setIssues] = useState([]);

  const queryDates = useMemo(() => ({
    from: toYmd(dateRange.from) || toYmd(subDays(new Date(), 27)),
    to: toYmd(dateRange.to) || toYmd(new Date()),
  }), [dateRange]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const jobsParams = new URLSearchParams({
        from: queryDates.from,
        to: queryDates.to,
        limit: '100',
      });
      if (payoutStatus !== 'ALL') jobsParams.set('payoutStatus', payoutStatus);
      if (pricingBasis !== 'ALL') jobsParams.set('pricingBasis', pricingBasis);
      if (submittedSearch) jobsParams.set('q', submittedSearch);

      const snapshotParams = new URLSearchParams({
        from: queryDates.from,
        to: queryDates.to,
      });

      const reconParams = new URLSearchParams({
        from: queryDates.from,
        to: queryDates.to,
        stripe: '0',
      });

      const [snapshotRes, jobsRes, reconRes] = await Promise.all([
        fetch(`/api/admin/financials?${snapshotParams}`, { credentials: 'include' }),
        fetch(`/api/admin/financials/jobs?${jobsParams}`, { credentials: 'include' }),
        fetch(`/api/admin/payouts/reconciliation?${reconParams}`, { credentials: 'include' }),
      ]);

      if (!snapshotRes.ok) {
        const err = await snapshotRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to load financial snapshot');
      }
      if (!jobsRes.ok) {
        const err = await jobsRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to load job financial records');
      }

      setSnapshot(await snapshotRes.json());
      setJobs(await jobsRes.json());

      if (reconRes.ok) {
        const recon = await reconRes.json();
        setIssues(Array.isArray(recon.issues) ? recon.issues : []);
      } else {
        setIssues([]);
      }
    } catch (error) {
      console.error('Financial dashboard load failed:', error);
      toast.error(error.message || 'Failed to load financial dashboard');
      setSnapshot(null);
      setJobs(null);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }, [queryDates, payoutStatus, pricingBasis, submittedSearch]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    }
  }, [status, loadData]);

  const resolveHold = async (holdId, action) => {
    setResolvingHoldId(holdId);
    try {
      const response = await fetch('/api/admin/payouts/holds', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ holdId, action }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} hold`);
      }
      toast.success(action === 'release' ? 'Hold released' : 'Held jobs voided');
      await loadData();
    } catch (error) {
      toast.error(error.message || 'Hold action failed');
    } finally {
      setResolvingHoldId(null);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'unauthenticated' || (user && user.role !== 'ADMIN')) {
    return null;
  }

  const economics = snapshot?.jobEconomics;
  const owed = snapshot?.owedToScoopers;
  const records = jobs?.records || [];
  const totals = jobs?.totals;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial operations</h1>
          <p className="text-muted-foreground">
            Per-job revenue, scooper share, Stripe fees, and Scoopify keep for the pilot.
            Dates use America/Denver.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowFilters((v) => !v)}>
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" onClick={loadData} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Completed date range</span>
                <DateRangePicker
                  value={dateRange}
                  onChange={(value) => {
                    setDateRange({
                      from: value?.from || subDays(new Date(), 27),
                      to: value?.to || new Date(),
                    });
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Payout status</span>
                <Select value={payoutStatus} onValueChange={setPayoutStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Payout status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="ALL">All statuses</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="HELD">Held</SelectItem>
                      <SelectItem value="PROCESSING">Processing</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="VOID">Void</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Pricing basis</span>
                <Select value={pricingBasis} onValueChange={setPricingBasis}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Pricing basis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="ALL">All bases</SelectItem>
                      <SelectItem value="SUBSCRIPTION_WEEKLY">Weekly club visit</SelectItem>
                      <SelectItem value="ONE_TIME">One-time</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search service, scooper, customer, transfer…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setSubmittedSearch(searchTerm.trim());
                  }}
                />
              </div>
              <Button
                onClick={() => setSubmittedSearch(searchTerm.trim())}
                disabled={loading}
              >
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && !snapshot ? (
        <div className="flex items-center justify-center h-[240px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Allocated revenue</CardDescription>
                <CardTitle className="text-2xl">{money(economics?.revenue)}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {economics?.jobsCompleted || 0} completed jobs in range
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Scooper share</CardDescription>
                <CardTitle className="text-2xl">{money(economics?.scooperShare)}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                75% of allocated visit price
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Stripe fees (est.)</CardDescription>
                <CardTitle className="text-2xl">{money(economics?.stripeFees)}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Absorbed by Scoopify, not deducted from scoopers
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Scoopify keep</CardDescription>
                <CardTitle className="text-2xl">{money(economics?.scoopifyKeep)}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                After scooper share, referrals, and Stripe fees
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Owed to scoopers</CardTitle>
                <CardDescription>Current unpaid balances (not limited to date range)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Pending</span><span>{money(owed?.pending?.amount)} · {owed?.pending?.count || 0} jobs</span></div>
                <div className="flex justify-between"><span>Held</span><span>{money(owed?.held?.amount)} · {owed?.held?.count || 0} jobs</span></div>
                <div className="flex justify-between"><span>Processing</span><span>{money(owed?.processing?.amount)} · {owed?.processing?.count || 0} jobs</span></div>
                <div className="flex justify-between"><span>Open adjustments</span><span>{money(owed?.adjustments?.amount)} · {owed?.adjustments?.count || 0}</span></div>
                <div className="flex justify-between font-medium pt-2 border-t"><span>Open holds</span><span>{owed?.openHolds || 0}</span></div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Open payout holds</CardTitle>
                <CardDescription>Refund and dispute holds blocking scooper pay</CardDescription>
              </CardHeader>
              <CardContent>
                {(snapshot?.openHolds || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No open holds.</p>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Created</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Scope</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {snapshot.openHolds.map((hold) => (
                          <TableRow key={hold.id}>
                            <TableCell>{formatWhen(hold.createdAt)}</TableCell>
                            <TableCell>{payoutStatusBadge(hold.reason)}</TableCell>
                            <TableCell>{hold.amount != null ? money(hold.amount) : '—'}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {hold.serviceId ? `Job ${hold.serviceId.slice(0, 8)}…` : hold.customerId ? `Customer ${hold.customerId.slice(0, 8)}…` : '—'}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={resolvingHoldId === hold.id}
                                onClick={() => resolveHold(hold.id, 'release')}
                              >
                                Release
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={resolvingHoldId === hold.id}
                                onClick={() => resolveHold(hold.id, 'void')}
                              >
                                Void
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {issues.length > 0 && (
            <Card className="border-amber-300">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Reconciliation issues
                </CardTitle>
                <CardDescription>From ledger reconciliation for this date range (Stripe balance check skipped here for speed).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {issues.map((issue, index) => (
                  <div key={`${issue.type}-${issue.payoutId || index}`} className="rounded-md bg-amber-50 px-3 py-2">
                    <span className="font-medium">{issue.type}</span>
                    {issue.payoutId ? <span className="text-muted-foreground"> · payout {issue.payoutId}</span> : null}
                    {issue.stripeTransferId ? <span className="text-muted-foreground"> · {issue.stripeTransferId}</span> : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent payouts</CardTitle>
              <CardDescription>Payout rows requested in the selected date range</CardDescription>
            </CardHeader>
            <CardContent>
              {(snapshot?.recentPayouts || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No payouts in this range.</p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Requested</TableHead>
                        <TableHead>Scooper</TableHead>
                        <TableHead>Week</TableHead>
                        <TableHead>Jobs</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Transfer</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {snapshot.recentPayouts.map((payout) => (
                        <TableRow key={payout.id}>
                          <TableCell>{formatWhen(payout.requestedAt)}</TableCell>
                          <TableCell>
                            <div className="font-medium">{payout.scooperName || '—'}</div>
                            <div className="text-xs text-muted-foreground">{payout.scooperEmail}</div>
                          </TableCell>
                          <TableCell>{formatWhen(payout.weekStart)}</TableCell>
                          <TableCell>{payout.serviceCount}</TableCell>
                          <TableCell>{money(payout.amount)}</TableCell>
                          <TableCell>{payoutStatusBadge(payout.status)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {payout.stripeTransferId || payout.failureReason || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-base">Per-job financial records</CardTitle>
                <CardDescription>
                  Showing {records.length} of {jobs?.pagination?.total || 0}
                  {totals ? ` · filtered totals ${money(totals.revenue)} revenue / ${money(totals.scooperShare)} scooper / ${money(totals.scoopifyKeep)} keep` : ''}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Completed</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Scooper</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Scooper</TableHead>
                      <TableHead className="text-right">Stripe fee</TableHead>
                      <TableHead className="text-right">Scoopify keep</TableHead>
                      <TableHead>Payout</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                          No job financial records match these filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      records.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <div>{formatWhen(row.completedAt)}</div>
                            <div className="text-xs text-muted-foreground">{row.pricingBasis === 'ONE_TIME' ? 'One-time' : 'Weekly visit'}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{row.customerName || '—'}</div>
                            <div className="text-xs text-muted-foreground">{row.customerEmail}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{row.scooperName || '—'}</div>
                            <div className="text-xs text-muted-foreground">
                              {row.scooperEmail}
                              {row.scooperPayoutsEnabled === false ? ' · Connect incomplete' : ''}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{row.planName || '—'}</TableCell>
                          <TableCell className="text-right font-medium">{money(row.revenue)}</TableCell>
                          <TableCell className="text-right">{money(row.scooperShare)}</TableCell>
                          <TableCell className="text-right">
                            {money(row.stripeFees)}
                            {row.stripeFeeEstimated ? <div className="text-[10px] text-muted-foreground">est.</div> : null}
                          </TableCell>
                          <TableCell className="text-right">{money(row.scoopifyKeep)}</TableCell>
                          <TableCell>
                            {payoutStatusBadge(row.payoutStatus)}
                            {row.holdReason ? (
                              <div className="text-[10px] text-muted-foreground mt-1">{row.holdReason}</div>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/admin/dashboard/services/${row.serviceId}`}>Job</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
