"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { plansApi, type Plan } from "@/lib/api";
import { toast } from "@/components/ui/toaster";
import {
    Plus, Edit2, Trash2, Loader2, Save, X, Shield
} from "lucide-react";
import Link from "next/link";

interface EditingPlan extends Partial<Plan> {
    isNew?: boolean;
}

export default function AdminPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<EditingPlan | null>(null);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && (!user || !user.isAdmin)) {
            router.replace("/dashboard");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!user?.isAdmin) return;
        plansApi.listAll(user.token)
            .then(setPlans)
            .catch(() => toast({ title: "Failed to load plans", variant: "destructive" }))
            .finally(() => setLoading(false));
    }, [user]);

    const handleSave = async () => {
        if (!user || !editing) return;
        setSaving(true);
        try {
            if (editing.isNew) {
                const created = await plansApi.create(user.token, {
                    name: editing.name!,
                    displayName: editing.displayName!,
                    description: editing.description ?? null,
                    priceCents: editing.priceCents ?? 0,
                    currency: editing.currency ?? "usd",
                    rateLimitRpm: editing.rateLimitRpm ?? 10,
                    monthlyQuota: editing.monthlyQuota ?? 100,
                    sortOrder: editing.sortOrder ?? 99,
                    stripePriceId: null,
                });
                setPlans((p) => [...p, created]);
                toast({ title: "Plan created" });
            } else {
                const updated = await plansApi.update(user.token, editing.id!, {
                    displayName: editing.displayName,
                    description: editing.description,
                    priceCents: editing.priceCents,
                    rateLimitRpm: editing.rateLimitRpm,
                    monthlyQuota: editing.monthlyQuota,
                    sortOrder: editing.sortOrder,
                });
                setPlans((p) => p.map((pl) => pl.id === updated.id ? updated : pl));
                toast({ title: "Plan updated" });
            }
            setEditing(null);
        } catch (err: any) {
            toast({ title: "Save failed", description: err.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivate = async (id: string) => {
        if (!user) return;
        setDeletingId(id);
        try {
            await plansApi.deactivate(user.token, id);
            setPlans((p) => p.map((pl) => pl.id === id ? { ...pl, isActive: false } : pl));
            toast({ title: "Plan deactivated" });
        } catch (err: any) {
            toast({ title: "Failed", description: err.message, variant: "destructive" });
        } finally {
            setDeletingId(null);
        }
    };

    if (isLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-primary" />
                    <div>
                        <h1 className="text-xl font-bold">Admin Panel</h1>
                        <p className="text-xs text-muted-foreground">Plan Management</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        ← Dashboard
                    </Link>
                    <button
                        onClick={() => setEditing({ isNew: true, currency: "usd", sortOrder: 99 })}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                        <Plus className="w-4 h-4" /> New Plan
                    </button>
                </div>
            </div>

            {/* Plans table */}
            <div className="glass rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Price</th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rate Limit</th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Monthly Quota</th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {plans.map((plan) => (
                            <tr key={plan.id} className="border-b border-border/50 hover:bg-white/2 transition-colors">
                                <td className="px-4 py-3">
                                    <p className="font-medium">{plan.displayName || plan.name}</p>
                                    <p className="text-xs text-muted-foreground font-mono">{plan.name}</p>
                                </td>
                                <td className="px-4 py-3">
                                    {plan.priceCents === 0 ? "Free" : `$${(plan.priceCents / 100).toFixed(0)}/mo`}
                                </td>
                                <td className="px-4 py-3">{plan.rateLimitRpm} rpm</td>
                                <td className="px-4 py-3">{plan.monthlyQuota.toLocaleString()}</td>
                                <td className="px-4 py-3">
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${plan.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-secondary text-muted-foreground"}`}>
                                        {plan.isActive ? "Active" : "Inactive"}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2 justify-end">
                                        <button
                                            onClick={() => setEditing({ ...plan })}
                                            className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        {plan.isActive && (
                                            <button
                                                onClick={() => handleDeactivate(plan.id)}
                                                disabled={deletingId === plan.id}
                                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-50"
                                            >
                                                {deletingId === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit/Create drawer */}
            {editing && (
                <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4" onClick={() => setEditing(null)}>
                    <div className="glass rounded-2xl w-full max-w-lg p-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="font-bold">{editing.isNew ? "Create Plan" : "Edit Plan"}</h2>
                            <button onClick={() => setEditing(null)} className="p-1.5 hover:bg-white/5 rounded-lg text-muted-foreground">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {editing.isNew && (
                                <div className="col-span-2">
                                    <label className="block text-xs text-muted-foreground mb-1">Internal Name (slug)</label>
                                    <input
                                        value={editing.name ?? ""}
                                        onChange={(e) => setEditing((prev) => ({ ...prev!, name: e.target.value }))}
                                        placeholder="e.g. starter"
                                        className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:border-primary"
                                    />
                                </div>
                            )}
                            <div className="col-span-2">
                                <label className="block text-xs text-muted-foreground mb-1">Display Name</label>
                                <input
                                    value={editing.displayName ?? ""}
                                    onChange={(e) => setEditing((prev) => ({ ...prev!, displayName: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:border-primary"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs text-muted-foreground mb-1">Description</label>
                                <textarea
                                    value={editing.description ?? ""}
                                    onChange={(e) => setEditing((prev) => ({ ...prev!, description: e.target.value }))}
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:border-primary resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">Price (cents)</label>
                                <input
                                    type="number"
                                    value={editing.priceCents ?? 0}
                                    onChange={(e) => setEditing((prev) => ({ ...prev!, priceCents: Number(e.target.value) }))}
                                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">Rate Limit (rpm)</label>
                                <input
                                    type="number"
                                    value={editing.rateLimitRpm ?? 10}
                                    onChange={(e) => setEditing((prev) => ({ ...prev!, rateLimitRpm: Number(e.target.value) }))}
                                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">Monthly Quota</label>
                                <input
                                    type="number"
                                    value={editing.monthlyQuota ?? 100}
                                    onChange={(e) => setEditing((prev) => ({ ...prev!, monthlyQuota: Number(e.target.value) }))}
                                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">Sort Order</label>
                                <input
                                    type="number"
                                    value={editing.sortOrder ?? 99}
                                    onChange={(e) => setEditing((prev) => ({ ...prev!, sortOrder: Number(e.target.value) }))}
                                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:border-primary"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-5 justify-end">
                            <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-white/5 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
