import React, { useEffect, useState } from 'react';

export default function CustomerRetentionMenu() {
  const [staleCustomers, setStaleCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStaleCustomers() {
      setLoading(true);
      const res = await fetch('/api/admin/credits-report');
      const { staleCustomers } = await res.json();
      setStaleCustomers(staleCustomers);
      setLoading(false);
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
