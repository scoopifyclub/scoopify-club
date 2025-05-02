import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function InterestSplash({ zipCode }) {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInterest = async (e) => {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/customer/interest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, zipCode })
    });
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center p-8">
        <h2 className="text-3xl font-extrabold mb-2 text-purple-700">You're on the Waitlist!</h2>
        <p className="mb-4 text-lg">We'll notify you as soon as we launch in <span className="font-semibold">{zipCode}</span>. You're helping bring Scoopify Club to your neighborhood!</p>
        <div className="my-6">
          <h3 className="text-xl font-semibold mb-2 text-purple-600">Want us here sooner?</h3>
          <p className="mb-2">Invite your friends and neighbors to join the waitlist. The more interest we see in your area, the faster we can launch!</p>
          <a
            href="#"
            className="inline-block mt-2 px-4 py-2 rounded bg-purple-600 text-white font-bold hover:bg-purple-700 transition"
          >
            Share Waitlist Link
          </a>
        </div>
        <div className="mt-8 text-gray-500 text-sm">
          <span>Follow us on social media for updates and early launch news!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-8 bg-white shadow-md rounded-lg mt-8">
      <h2 className="text-2xl font-bold mb-2 text-center">We're Expanding!</h2>
      <p className="mb-4 text-center">
        We don't have openings in <span className="font-semibold">{zipCode}</span> yet, but we're growing fast! Enter your info below and we'll reach out as soon as we're available.
      </p>
      <form onSubmit={handleInterest} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Submitting...' : 'Notify Me'}
        </Button>
      </form>
    </div>
  );
}
