'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, Search, Star, Phone, Mail, MapPin, Calendar, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  serviceFrequency: string;
  lastService: string;
  nextService: string;
  notes: string;
  rating: number;
}

export default function EmployeeCustomersPage() {
  const { data: session, status } = useSession();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      if (status === 'authenticated' && session?.user?.email) {
        try {
          // In a real app, you would fetch this data from your API
          // This is just mock data for demonstration
          setTimeout(() => {
            const mockCustomers: Customer[] = [];
            
            // Generate mock customers
            for (let i = 0; i < 12; i++) {
              mockCustomers.push({
                id: `cust-${i}`,
                name: `Customer ${i + 1}`,
                email: `customer${i + 1}@example.com`,
                phone: `(555) ${100 + i}-${1000 + i}`,
                address: `${100 + i} Main St, Anytown, US`,
                serviceFrequency: i % 3 === 0 ? 'Weekly' : i % 3 === 1 ? 'Bi-weekly' : 'Monthly',
                lastService: new Date(Date.now() - (i * 3 + 2) * 24 * 60 * 60 * 1000).toLocaleDateString(),
                nextService: new Date(Date.now() + (i * 2 + 2) * 24 * 60 * 60 * 1000).toLocaleDateString(),
                notes: i % 2 === 0 ? 'Prefers service in the morning' : 'Has pets, use gate code 1234',
                rating: 3 + (i % 3),
              });
            }
            
            setCustomers(mockCustomers);
            setFilteredCustomers(mockCustomers);
            setIsLoading(false);
          }, 1000);
        } catch (error) {
          console.error('Error fetching customers data:', error);
          setIsLoading(false);
        }
      }
    };
    
    fetchCustomers();
  }, [session, status]);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.address.toLowerCase().includes(query)
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchQuery, customers]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Customers</h1>
        <p className="text-gray-500">
          View and manage your assigned customers.
        </p>
      </div>
      
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
        <Input 
          placeholder="Search customers by name, email, or address..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map(customer => (
          <Card key={customer.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{customer.name}</CardTitle>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${i < customer.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
              </div>
              <CardDescription>
                Service Frequency: {customer.serviceFrequency}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm">
                <Phone className="h-4 w-4 mr-2 text-gray-500" />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-center text-sm">
                <Mail className="h-4 w-4 mr-2 text-gray-500" />
                <span>{customer.email}</span>
              </div>
              <div className="flex items-start text-sm">
                <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-1" />
                <span>{customer.address}</span>
              </div>
              <div className="border-t pt-3 mt-2">
                <div className="flex justify-between text-sm">
                  <div>
                    <Calendar className="h-4 w-4 inline mr-1 text-gray-500" />
                    Last Service:
                  </div>
                  <span>{customer.lastService}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <div>
                    <Calendar className="h-4 w-4 inline mr-1 text-gray-500" />
                    Next Service:
                  </div>
                  <span className="font-medium">{customer.nextService}</span>
                </div>
              </div>
              {customer.notes && (
                <div className="text-sm bg-yellow-50 p-2 rounded-md border border-yellow-100 mt-2">
                  <p className="font-medium text-yellow-800">Notes:</p>
                  <p className="text-yellow-700">{customer.notes}</p>
                </div>
              )}
              <div className="flex justify-end gap-2 mt-2">
                <Button size="sm" variant="outline">Contact</Button>
                <Button size="sm" variant="outline">View Details</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredCustomers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          {searchQuery ? (
            <p>No customers match your search</p>
          ) : (
            <p>No customers assigned to you yet</p>
          )}
        </div>
      )}
    </div>
  );
} 