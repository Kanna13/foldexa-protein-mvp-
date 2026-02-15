"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/ui/Navbar";
import { ArrowLeft, CreditCard, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const PLANS: Record<string, { price: string; name: string; features: string[] }> = {
    free: {
        price: "$0.00",
        name: "Free Tier",
        features: ["1 Job/day", "Basic Metrics", "Public Queue"],
    },
    standard: {
        price: "$9.99",
        name: "Standard Plan",
        features: ["10 Jobs/day", "Advanced Metrics", "Priority Queue", "Email Support"],
    },
    premium: {
        price: "$19.99",
        name: "Premium Plan",
        features: ["Unlimited Jobs", "All Metrics", "Top Priority", "Dedicated Support", "API Access"],
    },
};

export default function CheckoutPage() {
    const searchParams = useSearchParams();
    const planKey = searchParams.get("plan")?.toLowerCase() || "free";
    const plan = PLANS[planKey] || PLANS.free;
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            // Create Checkout Session
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/payments/create-checkout-session`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan: planKey }),
            });

            if (!response.ok) {
                throw new Error("Failed to create checkout session");
            }

            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("Something went wrong. Please try again.");
            }
        } catch (error) {
            console.error(error);
            alert("Payment service is currently unavailable in this demo. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white font-sans">
            <Navbar />

            <div className="max-w-4xl mx-auto px-6 pt-32 pb-20">
                <Link href="/#pricing" className="inline-flex items-center text-neutral-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Pricing
                </Link>

                <div className="grid md:grid-cols-5 gap-12">
                    {/* Order Summary */}
                    <div className="md:col-span-3">
                        <h1 className="text-4xl font-bold mb-2">Checkout</h1>
                        <p className="text-neutral-400 mb-8">Complete your subscription to {plan.name}</p>

                        <div className="bg-[#111] border border-white/10 rounded-2xl p-8 mb-8">
                            <h3 className="text-xl font-semibold mb-6">Order Summary</h3>

                            <div className="flex justify-between items-center py-4 border-b border-white/5">
                                <span className="text-neutral-300">{plan.name} (Monthly)</span>
                                <span className="font-mono">{plan.price}</span>
                            </div>

                            <div className="flex justify-between items-center py-4 text-emerald-500 font-bold text-lg">
                                <span>Total due today</span>
                                <span>{plan.price}</span>
                            </div>

                            <div className="mt-8 space-y-4">
                                <h4 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Includes:</h4>
                                <ul className="space-y-2">
                                    {plan.features.map((f) => (
                                        <li key={f} className="flex items-center text-sm text-neutral-300">
                                            <ShieldCheck className="w-4 h-4 mr-2 text-emerald-500" /> {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-neutral-500 justify-center">
                            <ShieldCheck className="w-4 h-4" /> Secure payment via Stripe. Encrypted & Safe.
                        </div>
                    </div>

                    {/* Payment Action */}
                    <div className="md:col-span-2">
                        <div className="bg-[#111] border border-white/10 rounded-2xl p-8 sticky top-32">
                            <h3 className="text-xl font-semibold mb-6">Payment Method</h3>

                            <div className="space-y-4 mb-8">
                                <button className="w-full flex items-center justify-between p-4 rounded-xl border border-emerald-500/50 bg-emerald-500/10 text-white">
                                    <span className="flex items-center gap-3 font-medium">
                                        <CreditCard className="w-5 h-5 text-emerald-500" /> Credit Card
                                    </span>
                                    <div className="w-4 h-4 rounded-full border-4 border-emerald-500 bg-white" />
                                </button>
                                <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-neutral-400 cursor-not-allowed opacity-50">
                                    <span className="flex items-center gap-3 font-medium">
                                        Unilink (Coming Soon)
                                    </span>
                                </div>
                            </div>

                            <div className="text-xs text-neutral-500 mb-6 leading-relaxed">
                                By continuing, you agree to our Terms of Service. You will be redirected to Stripe to securely complete your purchase.
                            </div>

                            <Button
                                onClick={handleSubscribe}
                                className="w-full py-6 text-lg font-bold bg-emerald-500 hover:bg-emerald-600 text-black"
                                disabled={loading}
                            >
                                {loading ? "Processing..." : `Pay ${plan.price}`}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
