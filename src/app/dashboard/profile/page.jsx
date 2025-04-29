'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
export default function ProfilePage() {
    var _a, _b, _c, _d;
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
        },
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const router = useRouter();
    useEffect(() => {
        const fetchProfile = async () => {
            var _a;
            try {
                const response = await fetch('/api/users/profile');
                if (!response.ok) {
                    throw new Error('Failed to fetch profile');
                }
                const userData = await response.json();
                setProfile({
                    name: userData.name || '',
                    email: userData.email,
                    phone: userData.phone || '',
                    address: ((_a = userData.customer) === null || _a === void 0 ? void 0 : _a.address) || {
                        street: '',
                        city: '',
                        state: '',
                        zipCode: '',
                    },
                });
            }
            catch (error) {
                console.error('Profile fetch error:', error);
                toast.error('Failed to load profile');
            }
            finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profile),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update profile');
            }
            toast.success('Profile updated successfully!');
        }
        catch (error) {
            console.error('Profile update error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to update profile');
        }
        finally {
            setSaving(false);
        }
    };
    if (loading) {
        return (<div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Loading profile...</h2>
        </div>
      </div>);
    }
    return (<div className="container mx-auto max-w-4xl py-8">
      <h1 className="mb-8 text-3xl font-bold">Profile Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={profile.name} onChange={(e) => setProfile(Object.assign(Object.assign({}, profile), { name: e.target.value }))} required/>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={profile.email} disabled className="bg-neutral-100"/>
            <p className="mt-1 text-sm text-neutral-500">
              Email cannot be changed
            </p>
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" value={profile.phone} onChange={(e) => setProfile(Object.assign(Object.assign({}, profile), { phone: e.target.value }))}/>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Address</h2>

          <div>
            <Label htmlFor="street">Street Address</Label>
            <Input id="street" value={(_a = profile.address) === null || _a === void 0 ? void 0 : _a.street} onChange={(e) => setProfile(Object.assign(Object.assign({}, profile), { address: Object.assign(Object.assign({}, profile.address), { street: e.target.value }) }))}/>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" value={(_b = profile.address) === null || _b === void 0 ? void 0 : _b.city} onChange={(e) => setProfile(Object.assign(Object.assign({}, profile), { address: Object.assign(Object.assign({}, profile.address), { city: e.target.value }) }))}/>
            </div>

            <div>
              <Label htmlFor="state">State</Label>
              <Input id="state" value={(_c = profile.address) === null || _c === void 0 ? void 0 : _c.state} onChange={(e) => setProfile(Object.assign(Object.assign({}, profile), { address: Object.assign(Object.assign({}, profile.address), { state: e.target.value }) }))}/>
            </div>
          </div>

          <div>
            <Label htmlFor="zipCode">ZIP Code</Label>
            <Input id="zipCode" value={(_d = profile.address) === null || _d === void 0 ? void 0 : _d.zipCode} onChange={(e) => setProfile(Object.assign(Object.assign({}, profile), { address: Object.assign(Object.assign({}, profile.address), { zipCode: e.target.value }) }))}/>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.push('/dashboard')}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>);
}
