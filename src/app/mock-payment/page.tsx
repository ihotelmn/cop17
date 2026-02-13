"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck } from "lucide-react";

function MockPaymentContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [processing, setProcessing] = useState(false);

    const invoiceId = searchParams.get("invoiceId");
    const amount = searchParams.get("amount");
    const txnId = searchParams.get("txnId");
    const returnUrl = searchParams.get("returnUrl");

    const handlePayment = async () => {
        setProcessing(true);
        // Simulate bank processing time
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (returnUrl) {
            router.push(returnUrl);
        } else {
            router.push("/");
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto shadow-2xl border-blue-100 dark:border-blue-900 mt-20">
            <CardHeader className="text-center bg-blue-600 text-white rounded-t-xl space-y-4 pb-8">
                <div className="mx-auto bg-white p-2 rounded-lg w-fit">
                    {/* Placeholder for Bank Logo */}
                    <div className="h-8 w-24 bg-blue-900 flex items-center justify-center text-xs font-bold text-white">
                        GOLOMT BANK
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold">Secure Payment Gateway</CardTitle>
                <CardDescription className="text-blue-100">
                    Entering secure environment
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-8">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Merchant:</span>
                        <span className="font-medium">COP17 Mongolia</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Invoice ID:</span>
                        <span className="font-medium">{invoiceId}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Transaction ID:</span>
                        <span className="font-mono text-xs text-zinc-400">{txnId}</span>
                    </div>
                    <div className="border-t border-dashed my-4" />
                    <div className="flex justify-between items-end">
                        <span className="font-bold">Total Amount:</span>
                        <span className="text-3xl font-bold text-blue-600">${amount}</span>
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex gap-3 items-start">
                    <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                        This is a secure 256-bit encrypted transaction. Your card details are never shared with the merchant.
                    </p>
                </div>
            </CardContent>
            <CardFooter>
                <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
                    onClick={handlePayment}
                    disabled={processing}
                >
                    {processing ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processing Payment...
                        </>
                    ) : (
                        `Pay $${amount}`
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function MockPaymentPage() {
    return (
        <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 p-4">
            <Suspense fallback={<div>Loading...</div>}>
                <MockPaymentContent />
            </Suspense>
        </div>
    );
}
