"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, DollarSign, Handshake, Leaf, Home, Calendar, CheckCircle } from 'lucide-react';

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
    <div className="max-w-4xl mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Business Partnership Program</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Partner with Scoopify Club to offer professional dog waste removal services to your customers
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Program Benefits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Handshake className="h-6 w-6 text-blue-600" />
              Why Partner With Us?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold">Expand Your Service Offerings</h4>
                <p className="text-sm text-gray-600">Add dog waste removal to your existing lawn care, landscaping, or home service portfolio</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold">Keep Customers Happy</h4>
                <p className="text-sm text-gray-600">Help your customers maintain clean, safe yards between your visits</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold">Earn Residual Income</h4>
                <p className="text-sm text-gray-600">Get $5/month for every customer you refer who stays active</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold">Professional Service</h4>
                <p className="text-sm text-gray-600">We handle everything - scheduling, service, billing, and customer support</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-6 w-6 text-green-600" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">1</Badge>
              <div>
                <h4 className="font-semibold">Sign Up & Get Your Code</h4>
                <p className="text-sm text-gray-600">Complete this form to receive your unique referral code</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">2</Badge>
              <div>
                <h4 className="font-semibold">Share With Customers</h4>
                <p className="text-sm text-gray-600">Offer dog waste removal to your existing customers using your referral code</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">3</Badge>
              <div>
                <h4 className="font-semibold">We Handle Everything</h4>
                <p className="text-sm text-gray-600">Scoopify Club manages scheduling, service delivery, and customer support</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">4</Badge>
              <div>
                <h4 className="font-semibold">Earn Monthly Commissions</h4>
                <p className="text-sm text-gray-600">Get $5/month for every active customer you referred</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Perfect For Section */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-6 w-6 text-purple-600" />
            Perfect For These Businesses
          </CardTitle>
          <CardDescription>
            Any business that serves homeowners can benefit from our dog waste removal partnership
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Leaf className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h4 className="font-semibold text-green-800">Lawn Care Companies</h4>
              <p className="text-sm text-green-700">Keep yards clean between mowing visits</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Home className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h4 className="font-semibold text-blue-800">Landscapers</h4>
              <p className="text-sm text-blue-700">Maintain beautiful outdoor spaces</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Users className="h-12 w-12 text-purple-600 mx-auto mb-3" />
              <h4 className="font-semibold text-purple-800">Property Managers</h4>
              <p className="text-sm text-purple-700">Keep rental properties clean and safe</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission Structure */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-600" />
            Commission Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Monthly Residual Income</h4>
              <div className="text-3xl font-bold text-green-600 mb-2">$5/month</div>
              <p className="text-sm text-green-700">For every active customer you refer</p>
              <ul className="text-sm text-green-700 mt-3 space-y-1">
                <li>• Ongoing monthly payments</li>
                <li>• No limit on referrals</li>
                <li>• Automatic monthly payouts</li>
              </ul>
            </div>
            <div className="p-6 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Monthly Commission</h4>
              <div className="text-3xl font-bold text-blue-600 mb-2">$5</div>
              <p className="text-sm text-blue-700">Per active referral per month</p>
              <ul className="text-sm text-blue-700 mt-3 space-y-1">
                <li>• Residual monthly income</li>
                <li>• Paid as long as customer stays</li>
                <li>• Automatic monthly payouts</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signup Form */}
      <Card>
        <CardHeader>
          <CardTitle>Business Partner Application</CardTitle>
          <CardDescription>
            Fill out the form below to start earning commissions from dog waste removal referrals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <Input
                  name="businessName"
                  value={form.businessName}
                  onChange={handleChange}
                  required
                  placeholder="Your Company Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact First Name *
                </label>
                <Input
                  name="contactFirstName"
                  value={form.contactFirstName}
                  onChange={handleChange}
                  required
                  placeholder="First Name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Last Name *
                </label>
                <Input
                  name="contactLastName"
                  value={form.contactLastName}
                  onChange={handleChange}
                  required
                  placeholder="Last Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <Input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <Input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="contact@yourbusiness.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payout Method *
              </label>
              <select
                name="payoutMethod"
                value={form.payoutMethod}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="STRIPE">Stripe (Recommended)</option>
                <option value="CASH_APP">Cash App</option>
              </select>
            </div>

            {form.payoutMethod === 'STRIPE' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stripe Account ID
                </label>
                <Input
                  name="stripeAccountId"
                  value={form.stripeAccountId}
                  onChange={handleChange}
                  placeholder="acct_1234567890"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Your Stripe Connect account ID for direct deposits
                </p>
              </div>
            )}

            {form.payoutMethod === 'CASH_APP' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cash App Username
                </label>
                <Input
                  name="cashAppUsername"
                  value={form.cashAppUsername}
                  onChange={handleChange}
                  placeholder="$YourUsername"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 text-lg font-semibold"
            >
              {loading ? 'Submitting...' : 'Become a Business Partner'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
