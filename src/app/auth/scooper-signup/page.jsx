'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import PasswordStrength from '@/components/auth/PasswordStrength';

import { findZipsInRadius, generateTestZips } from '@/lib/zip-proximity';

// Calculate ZIP codes within travel distance
async function fetchZipCodesInRadius(zipCode, distance) {
  if (!zipCode || !distance) return [];
  try {
    // Use our proximity utility to find nearby ZIPs
    const nearbyZips = findZipsInRadius(zipCode, parseInt(distance));
    
    // If no nearby ZIPs found (e.g., ZIP not in our database), generate test ZIPs
    if (nearbyZips.length <= 1) {
      return generateTestZips(zipCode, parseInt(distance));
    }
    
    return nearbyZips;
  } catch (e) {
    console.error('Error calculating ZIP codes in radius:', e);
    // Fallback to test ZIPs
    return generateTestZips(zipCode, parseInt(distance));
  }
}

export default function ScooperSignUp() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        role: 'EMPLOYEE',
        travelDistance: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isPasswordValid, setIsPasswordValid] = useState(false);
    const [coveredZips, setCoveredZips] = useState([]);
    const router = useRouter();
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => (Object.assign(Object.assign({}, prev), { [name]: type === 'checkbox' ? checked : value })));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        console.log('Form data on submit:', formData);
        
        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }
        // Validate password strength
        if (!isPasswordValid) {
            setError('Please ensure your password meets all requirements');
            setLoading(false);
            return;
        }
        
        // Check if all required fields are filled
        const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'password', 'street', 'city', 'state', 'zipCode', 'travelDistance'];
        const missingFields = requiredFields.filter(field => !formData[field]);
        
        if (missingFields.length > 0) {
            setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
            setLoading(false);
            return;
        }
        
        try {
            // Validate coveredZips is not empty
            if (!coveredZips || coveredZips.length === 0) {
                setError('Please enter a valid ZIP code and travel distance to calculate coverage area');
                setLoading(false);
                return;
            }

            // Create the payload with the required fields
            const payload = {
                email: formData.email,
                name: `${formData.firstName} ${formData.lastName}`,
                password: formData.password,
                phone: formData.phone,
                role: 'EMPLOYEE',
                deviceFingerprint: window.navigator.userAgent,
                address: {
                    street: formData.street,
                    city: formData.city,
                    state: formData.state,
                    zipCode: formData.zipCode
                },
                travelDistance: parseInt(formData.travelDistance),
                coveredZips: coveredZips
            };
            
            console.log('Sending payload:', payload);
            console.log('Covered ZIPs count:', coveredZips.length);
            console.log('Travel distance:', formData.travelDistance);
            
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            
            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);
            
            if (!response.ok) {
                console.error('API Error:', data);
                throw new Error(data.error || `Failed to create account (Status: ${response.status})`);
            }
            // Redirect to login page
            router.push('/auth/signin?registered=true');
        }
        catch (error) {
            console.error('Signup error:', error);
            setError(error instanceof Error ? error.message : 'An error occurred');
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
      async function updateCoveredZips() {
        if (formData.zipCode && formData.travelDistance) {
          const zips = await fetchZipCodesInRadius(formData.zipCode, formData.travelDistance);
          setCoveredZips(zips);
        } else {
          setCoveredZips([]);
        }
      }
      updateCoveredZips();
    }, [formData.zipCode, formData.travelDistance]);

    return (<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign up as a Scooper
          </h2>
          
          {/* Scooper Benefits Section */}
          <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
            <h3 className="text-lg font-medium text-purple-800 mb-2">Scooper Benefits</h3>
            <ul className="text-sm text-gray-700 space-y-2 list-disc pl-5">
              <li>Earn 75% of service fees after deductions</li>
              <li>Flexible schedule - claim jobs that work for you</li>
              <li>Get paid weekly through stripe direct deposit or daily via cash app</li>
              <li>Real-time notifications for new job opportunities</li>
              <li>Track your earnings and completed services</li>
            </ul>
          </div>
          
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/auth/signin" className="font-medium text-purple-600 hover:text-purple-500">
              Sign in
            </a>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input id="firstName" name="firstName" type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm" value={formData.firstName} onChange={handleChange}/>
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input id="lastName" name="lastName" type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm" value={formData.lastName} onChange={handleChange}/>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input id="email" name="email" type="email" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm" value={formData.email} onChange={handleChange}/>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input id="phone" name="phone" type="tel" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm" value={formData.phone} onChange={handleChange}/>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input id="password" name="password" type="password" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm" value={formData.password} onChange={handleChange}/>
              <PasswordStrength password={formData.password} onChange={setIsPasswordValid}/>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input id="confirmPassword" name="confirmPassword" type="password" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm" value={formData.confirmPassword} onChange={handleChange}/>
            </div>

            <div>
              <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                Street Address
              </label>
              <input id="street" name="street" type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm" value={formData.street} onChange={handleChange}/>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input id="city" name="city" type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm" value={formData.city} onChange={handleChange}/>
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <input id="state" name="state" type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm" value={formData.state} onChange={handleChange}/>
              </div>
            </div>

            <div>
              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                ZIP Code
              </label>
              <input id="zipCode" name="zipCode" type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm" value={formData.zipCode} onChange={handleChange}/>
            </div>

            <div>
              <label htmlFor="travelDistance" className="block text-sm font-medium text-gray-700">
                Travel Distance (miles)
              </label>
              <input id="travelDistance" name="travelDistance" type="number" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm" value={formData.travelDistance} onChange={handleChange}/>
            </div>
          </div>

                     {coveredZips.length > 0 && (
             <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
               <div className="text-sm font-medium text-blue-800 mb-2">
                 🗺️ Your Service Coverage Area
               </div>
               <div className="text-xs text-blue-600 mb-3">
                 Based on {formData.travelDistance} mile travel distance from {formData.zipCode}
               </div>
               <div className="flex flex-wrap gap-2 mb-3">
                 {coveredZips.map(zip => (
                   <span key={zip} className="px-2 py-1 bg-blue-200 rounded text-xs font-mono font-bold">
                     {zip}
                   </span>
                 ))}
               </div>
               <div className="text-xs text-blue-600">
                 💡 This will create {coveredZips.length} coverage area{coveredZips.length !== 1 ? 's' : ''} in our system
               </div>
             </div>
           )}

          {error && (<div className="text-red-500 text-sm text-center">{error}</div>)}

          <div>
            <Button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500" disabled={loading}>
              {loading ? 'Creating account...' : 'Create scooper account'}
            </Button>
          </div>
        </form>
      </div>
    </div>);
}
