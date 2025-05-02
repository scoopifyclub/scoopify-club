import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function BusinessPartnerManagement() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/business-partners');
      const data = await res.json();
      setBusinesses(data.businesses);
    } catch (e) {
      // Handle error
    }
    setLoading(false);
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <Card className="my-8">
      <CardHeader>
        <CardTitle>Business Partners</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Payout Method</TableHead>
              <TableHead>Referral Code</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {businesses.map((biz) => (
              <TableRow key={biz.id}>
                <TableCell>{biz.businessName}</TableCell>
                <TableCell>{biz.contactFirstName} {biz.contactLastName}</TableCell>
                <TableCell>{biz.email}</TableCell>
                <TableCell>{biz.phone}</TableCell>
                <TableCell>{biz.payoutMethod === 'STRIPE' ? 'Stripe' : 'Cash App'}</TableCell>
                <TableCell>{biz.referralCodes && biz.referralCodes.length > 0 ? biz.referralCodes[0].code : '-'}</TableCell>
                <TableCell>
                  <Badge variant="default">Active</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
