import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

export default function CustomerRetentionMenu() {
  const [staleCustomers, setStaleCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStaleCustomers() {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/credits-report', {
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch stale customers');
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch stale customers');
        }

        // Transform the data to match the expected structure
        const transformedCustomers = data.staleCustomers?.map(customer => ({
          id: customer.id,
          creditsDepletedAt: customer.creditsDepletedAt,
          phone: customer.User?.phone || '-',
          email: customer.User?.email || '-',
          stripeCustomerId: customer.stripeCustomerId || '-'
        })) || [];

        setStaleCustomers(transformedCustomers);
      } catch (error) {
        console.error('Error fetching stale customers:', error);
        toast.error('Failed to load customer retention data', {
          description: error.message
        });
        setStaleCustomers([]);
      } finally {
        setLoading(false);
      }
    }

    fetchStaleCustomers();
  }, []);

  return (
    <div>
      <h2>Customer Retention <span style={{background:'#e53e3e',color:'#fff',borderRadius:'50%',padding:'0.2em 0.6em',marginLeft:8,fontSize:'0.9em'}}>{staleCustomers.length}</span></h2>
      {loading ? (
        <p>Loading...</p>
      ) : staleCustomers.length === 0 ? (
        <p>All customers are current!</p>
      ) : (
        <table style={{width:'100%',marginTop:12}}>
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Depleted Since</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Stripe ID</th>
            </tr>
          </thead>
          <tbody>
            {staleCustomers.map(c => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.creditsDepletedAt ? new Date(c.creditsDepletedAt).toLocaleDateString() : '-'}</td>
                <td>{c.phone || '-'}</td>
                <td>{c.email || '-'}</td>
                <td>{c.stripeCustomerId || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
