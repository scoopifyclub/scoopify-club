'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function ProfilePage() {
    const { user, loading } = useAuth({
        required: true,
        role: 'EMPLOYEE',
        redirectTo: '/auth/signin'
    });

    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        bio: '',
        cashAppUsername: '',
        stripeAccountId: '',
        preferredPaymentMethod: ''
    });

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user?.id) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            const response = await fetch('/api/employee/profile', {
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Failed to fetch profile');
            }
            const data = await response.json();
            setProfile(data);
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const response = await fetch('/api/employee/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profile),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            toast.success('Profile updated successfully');
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Profile</h1>
                <Button
                    onClick={() => setIsEditing(!isEditing)}
                    variant={isEditing ? "outline" : "default"}
                >
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="p-6">
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                disabled={!isEditing}
                            />
                        </div>

                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={profile.email}
                                disabled
                            />
                        </div>

                        <div>
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={profile.phone}
                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                disabled={!isEditing}
                            />
                        </div>

                        <div>
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                                id="bio"
                                value={profile.bio}
                                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                disabled={!isEditing}
                                rows={4}
                            />
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="cashAppUsername">Cash App Username</Label>
                            <Input
                                id="cashAppUsername"
                                value={profile.cashAppUsername}
                                onChange={(e) => setProfile({ ...profile, cashAppUsername: e.target.value })}
                                disabled={!isEditing}
                            />
                        </div>

                        <div>
                            <Label htmlFor="stripeAccountId">Stripe Account ID</Label>
                            <Input
                                id="stripeAccountId"
                                value={profile.stripeAccountId}
                                disabled
                            />
                        </div>

                        <div>
                            <Label htmlFor="preferredPaymentMethod">Preferred Payment Method</Label>
                            <select
                                id="preferredPaymentMethod"
                                className="w-full p-2 border rounded-md"
                                value={profile.preferredPaymentMethod}
                                onChange={(e) => setProfile({ ...profile, preferredPaymentMethod: e.target.value })}
                                disabled={!isEditing}
                            >
                                <option value="">Select a payment method</option>
                                <option value="cashapp">Cash App</option>
                                <option value="stripe">Stripe</option>
                            </select>
                        </div>
                    </div>
                </Card>

                {isEditing && (
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                )}
            </form>
        </div>
    );
}
