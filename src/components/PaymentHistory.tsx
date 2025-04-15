'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { CreditCard } from 'lucide-react'

interface Payment {
  id: string
  amount: number
  status: string
  date: string
  type: string
}

export function PaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/payments/history')
      const data = await response.json()
      setPayments(data)
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading payment history...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Payment History</h3>
      </div>

      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-neutral-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b">
                  <td className="px-4 py-3 text-sm text-neutral-600">
                    {format(new Date(payment.date), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-600">
                    ${payment.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-600">
                    {payment.type}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        payment.status === 'SUCCEEDED'
                          ? 'bg-green-100 text-green-800'
                          : payment.status === 'FAILED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 