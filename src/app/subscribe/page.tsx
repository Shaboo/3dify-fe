"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { plansApi, subscriptionApi, type Plan } from "@/lib/api";
import { toast } from "@/components/ui/toaster";
import { Check, Loader2, Zap, Crown, Rocket } from "lucide-react";
import Link from "next/link";

const planIcons: Record<string, React.ReactNode> = {
    free: <Zap className="w-6 h-6" />,
    pro: <Rocket className="w-6 h-6" />,
    enterprise: <Crown className="w-6 h-6" />,
};

const planFeatures: Record<string, string[]> = {
    free: ["100 jobs/month", "10 req/min", "GLB + USDZ output", "Job history", "API access"],
    pro: ["2,000 jobs/month", "50 req/min", "GLB + USDZ output", "Webhook delivery", "Priority queue"],
    enterprise: ["50,000 jobs/month", "200 req/min", "GLB + USDZ output", "Dedicated support", "SLA guarantee"],
};

function formatPrice(priceCents: number, currency: string) {
    if (priceCents === 0) return "Free";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
        minimumFractionDigits: 0,
    }).format(priceCents / 100);
}

export default function SubscribePage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [subscribingId, setSubscribingId] = useState<string | null>(null);

    useEffect(() => {
        plansApi.listActive()
            .then(setPlans)
            .catch(() => toast({ title: "Failed to load plans", variant: "destructive" }))
            .finally(() => setLoadingPlans(false));
    }, []);

    const handleSubscribe = async (plan: Plan) => {
        if (!user) {
            router.push("/auth/register");
            return;
        }
        setSubscribingId(plan.id);
        try {
            const origin = window.location.origin;
            const { checkoutUrl } = await subscriptionApi.createCheckout(
                user.token,
                plan.id,
                `${origin}/subscribe/success`,
                `${origin}/subscribe/cancel`
            );
            // For free plan, checkoutUrl == successUrl, so just navigate
            window.location.href = checkoutUrl;
        } catch (err: any) {
            toast({ title: "Could not start checkout", description: err.message, variant: "destructive" });
            setSubscribingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-16 px-4">
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-12 animate-fade-in">
                <Link href="/" className="text-2xl font-bold gradient-text block mb-8">Omni3D</Link>
                <h1 className="text-4xl font-bold mb-4">Choose your plan</h1>
                <p className="text-muted-foreground text-lg">
                    Start free, scale as you grow. Every plan includes full API access and both GLB and USDZ output formats.
                </p>
            </div>

            {/* Pricing Grid */}
            {loadingPlans ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto animate-fade-in">
                    {plans.map((plan, i) => {
                        const isPopular = plan.name === "pro";
                        const features = planFeatures[plan.name] || [];
                        const icon = planIcons[plan.name] || <Zap className="w-6 h-6" />;
                        const isLoading = subscribingId === plan.id;

                        return (
                            <div
                                key={plan.id}
                                className={`relative rounded-2xl p-8 flex flex-col animate-slide-in ${isPopular
                                        ? "border-2 border-primary bg-primary/5"
                                        : "glass"
                                    }`}
                                style={{ animationDelay: `${i * 0.1}s` }}
                            >
                                {isPopular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider">
                                        Most Popular
                                    </div>
                                )}

                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${isPopular ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
                                    {icon}
                                </div>

                                <h2 className="text-xl font-bold mb-1">{plan.displayName || plan.name}</h2>
                                <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">{plan.description}</p>

                                <div className="mb-6">
                                    <span className="text-4xl font-bold">{formatPrice(plan.priceCents, plan.currency)}</span>
                                    {plan.priceCents > 0 && <span className="text-muted-foreground text-sm ml-1">/month</span>}
                                </div>

                                <ul className="space-y-2.5 mb-8 flex-1">
                                    {features.map((f) => (
                                        <li key={f} className="flex items-center gap-2 text-sm">
                                            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => handleSubscribe(plan)}
                                    disabled={!!subscribingId}
                                    className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${isPopular
                                            ? "bg-primary text-primary-foreground hover:opacity-90"
                                            : "border border-border hover:bg-white/5"
                                        } disabled:opacity-50`}
                                >
                                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {plan.priceCents === 0 ? "Get Started Free" : `Subscribe — ${formatPrice(plan.priceCents, plan.currency)}/mo`}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            <p className="text-center text-sm text-muted-foreground mt-12">
                Already subscribed?{" "}
                <Link href="/dashboard" className="text-primary hover:underline">Go to Dashboard</Link>
            </p>
        </div>
    );
}
