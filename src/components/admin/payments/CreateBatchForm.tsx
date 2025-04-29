"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { Label } from '@/components/ui/label';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
});

/**
 * @typedef {Object} PaymentBatch
 * @property {string} name
 * @property {string} description
 * @property {number} amount
 * @property {Date} dueDate
 */

/**
 * Form component for creating a new payment batch
 * @param {Object} props
 * @param {(batch: PaymentBatch) => Promise<void>} props.onSubmit
 * @returns {JSX.Element}
 */
export default function CreateBatchForm({ onSubmit }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    dueDate: ''
  });

  /**
   * Handles form submission
   * @param {React.FormEvent} e
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid amount');
      }

      await onSubmit({
        ...formData,
        amount,
        dueDate: new Date(formData.dueDate)
      });

      setFormData({
        name: '',
        description: '',
        amount: '',
        dueDate: ''
      });

      toast.success('Payment batch created successfully');
    } catch (error) {
      console.error('Error creating payment batch:', error);
      toast.error('Failed to create payment batch');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles form input changes
   * @param {React.ChangeEvent<HTMLInputElement>} e
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Payment Batch</CardTitle>
        <CardDescription>Create a new batch of payments for processing</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Batch Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter batch name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter batch description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
                required
              />
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Batch'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 