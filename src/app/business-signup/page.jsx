"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function BusinessSignupPage() {
  const [form, setForm] = useState({
    businessName: '',
    contactFirstName: '',
    contactLastName: '',
    phone: '',
    email: '',
    payoutMethod: 'STRIPE',
    stripeAccountId: '',
    cashAppUsername: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/business-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        toast.error(data.error || 'Signup failed');
      }
    } catch (err) {
      toast.error('Signup failed');
    }
    setLoading(false);
  };
  if (success) {
    return (
      <div className="max-w-xl mx-auto py-16">
        <h2 className="text-2xl font-bold mb-4">Signup Complete!</h2>
        <p className="mb-2">Thank you for signing up as a business partner. Your unique referral code and all details have been emailed to you.</p>
        <p>If you have questions, contact support@scoopify.com.</p>
      </div>
    );
  }
  return (
    <div className="max-w-xl mx-auto py-16">
      <h2 className="text-2xl font-bold mb-6">Business Partner Signup</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input name="businessName" label="Business Name" placeholder="Business Name" value={form.businessName} onChange={handleChange} required />
        <div className="flex space-x-2">
          <Input name="contactFirstName" label="First Name" placeholder="Contact First Name" value={form.contactFirstName} onChange={handleChange} required />
          <Input name="contactLastName" label="Last Name" placeholder="Contact Last Name" value={form.contactLastName} onChange={handleChange} required />
        </div>
        <Input name="phone" label="Phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} required />
        <Input name="email" label="Email" placeholder="Email Address" value={form.email} onChange={handleChange} required type="email" />
        <div>
          <label className="block text-sm font-medium mb-1">Preferred Payout Method</label>
          <select name="payoutMethod" value={form.payoutMethod} onChange={handleChange} className="w-full border rounded p-2">
            <option value="STRIPE">Stripe</option>
            <option value="CASH_APP">Cash App</option>
          </select>
        </div>
        {form.payoutMethod === 'STRIPE' ? (
          <Input name="stripeAccountId" label="Stripe Account ID" placeholder="Stripe Account ID" value={form.stripeAccountId} onChange={handleChange} required />
        ) : (
          <Input name="cashAppUsername" label="Cash App Username" placeholder="$username" value={form.cashAppUsername} onChange={handleChange} required />
        )}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Submitting...' : 'Sign Up'}
        </Button>
      </form>
    </div>
  );
}
