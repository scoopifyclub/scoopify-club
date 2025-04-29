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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
});
export default function CreateBatchForm() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
        },
    });
    async function onSubmit(values) {
        setIsLoading(true);
        try {
            const response = await fetch("/api/admin/payments/batch", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to create batch");
            }
            const batch = await response.json();
            toast({
                title: "Batch created successfully",
                description: `Batch "${batch.name}" has been created`,
            });
            // Reset form
            form.reset();
            // Refresh the page to show the new batch
            router.refresh();
        }
        catch (error) {
            toast({
                title: "Error creating batch",
                description: error.message,
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
        }
    }
    return (<Card className="max-w-2xl mx-auto">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem>
                  <FormLabel>Batch Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Weekly Payments - June 1-7" {...field}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>)}/>
            <FormField control={form.control} name="description" render={({ field }) => (<FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter details about this payment batch" className="resize-none" {...field}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>)}/>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (<>Creating batch...</>) : (<>
                  <PlusCircle className="h-4 w-4 mr-2"/>
                  Create New Batch
                </>)}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>);
}
