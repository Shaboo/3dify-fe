"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { plansApi, subscriptionApi, type Plan, type SubscriptionStatus } from "@/lib/api";
import { toast } from "@/components/ui/toaster";
import {
    CreditCard, ExternalLink, Loader2, RefreshCw, Settings,
    TrendingUp, Users, Zap
} from "lucide-react";
import Link from "next/link";

export default function DashboardSubscriptionTab() {
    const { user } = useAuth();
    const router = useRouter();
    const [sub, setSub] = useState<SubscriptionStatus | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [portalLoading, setPortalLoading] = useState(false);

    useEffect(() => {
        if (!user) return;
        Promise.all([
            subscriptionApi.getStatus(user.token),
            plansApi.listActive()
        ])
            .then(([status, activePlans]) => {
                setSub(status);
                setPlans(activePlans);
            })
            .catch(() => toast({ title: "Failed to load subscription", variant: "destructive" }))
            .finally(() => setLoading(false));
    }, [user]);

    const handleManageBilling = async () => {
        if (!user) return;
        setPortalLoading(true);
        try {
            const { portalUrl } = await subscriptionApi.createPortal(
                user.token,
                window.location.href
            );
            window.location.href = portalUrl;
        } catch (err: any) {
            toast({ title: "Could not open billing portal", description: err.message, variant: "destructive" });
            setPortalLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const isActive = sub?.isActive ?? false;
    const statusColor = {
        active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        trialing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        past_due: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        canceled: "bg-red-500/10 text-red-400 border-red-500/20",
    }[sub?.status ?? "canceled"] ?? "bg-secondary text-muted-foreground border-border";

    return (
        <div className="space-y-6">
            {/* Current plan card */}
            <div className="glass rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold mb-1">
                            {sub?.displayName ?? sub?.planName ?? "No Plan"}
                        </h2>
                        {sub?.status && (
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColor}`}>
                                {sub.status.replace("_", " ").toUpperCase()}
                            </span>
                        )}
                        {sub?.currentPeriodEnd && (
                            <p className="text-sm text-muted-foreground mt-2">
                                Renews {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                    <div className="text-right">
                        {sub?.priceCents != null && sub.priceCents > 0 ? (
                            <p className="text-2xl font-bold">
                                ${(sub.priceCents / 100).toFixed(0)}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                            </p>
                        ) : (
                            <p className="text-2xl font-bold text-emerald-400">Free</p>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 mt-6">
                    {sub?.priceCents != null && sub.priceCents > 0 && isActive && (
                        <button
                            onClick={handleManageBilling}
                            disabled={portalLoading}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-white/5 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            {portalLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <CreditCard className="w-4 h-4" />
                            )}
                            Manage Billing
                        </button>
                    )}
                    <Link
                        href="/subscribe"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium"
                    >
                        <TrendingUp className="w-4 h-4" />
                        {sub?.status === "canceled" || !sub ? "Subscribe" : "Change Plan"}
                    </Link>
                </div>
            </div>

            {/* Past due warning */}
            {sub?.status === "past_due" && (
                <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-4">
                    <p className="text-sm text-yellow-400 font-medium">Payment overdue</p>
                    <p className="text-xs text-yellow-400/70 mt-1">
                        Your API keys are temporarily suspended. Update your billing to restore access.
                    </p>
                    <button
                        onClick={handleManageBilling}
                        className="mt-3 flex items-center gap-1.5 text-xs text-yellow-400 hover:underline"
                    >
                        <ExternalLink className="w-3 h-3" /> Update payment method
                    </button>
                </div>
            )}

            {/* Available plans */}
            <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Available Plans</h3>
                <div className="grid gap-3">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`glass rounded-xl p-4 flex items-center justify-between ${sub?.planName === plan.name ? "border border-primary/40" : ""}`}
                        >
                            <div>
                                <p className="font-medium text-sm">{plan.displayName || plan.name}</p>
                                <p className="text-xs text-muted-foreground">{plan.rateLimitRpm} req/min · {plan.monthlyQuota.toLocaleString()} jobs/month</p>
                            </div>
                            <div className="text-right flex items-center gap-3">
                                <span className="text-sm font-semibold">
                                    {plan.priceCents === 0 ? "Free" : `$${(plan.priceCents / 100).toFixed(0)}/mo`}
                                </span>
                                {sub?.planName !== plan.name && (
                                    <Link
                                        href="/subscribe"
                                        className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-white/5 transition-colors"
                                    >
                                        Switch
                                    </Link>
                                )}
                                {sub?.planName === plan.name && (
                                    <span className="text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full">Current</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
