"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiKeysApi, jobsApi, webhookApi, type ApiKey, type ApiKeyCreated, type Job, type Webhook, type JobHistoryEntry } from "@/lib/api";
import { toast } from "@/components/ui/toaster";
import {
    Key, Plus, Trash2, LogOut, Copy, CheckCircle2,
    Clock, Loader2, XCircle, RefreshCw, Briefcase,
    Webhook as WebhookIcon, Save, History, X, ArrowRight
} from "lucide-react";

// ---- Status Badge ----
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { cls: string; icon: React.ReactNode }> = {
        PENDING: { cls: "status-pending", icon: <Clock className="w-3 h-3" /> },
        PROCESSING: { cls: "status-processing", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
        SUCCESS: { cls: "status-success", icon: <CheckCircle2 className="w-3 h-3" /> },
        FAILED: { cls: "status-failed", icon: <XCircle className="w-3 h-3" /> },
    };
    const s = map[status] || map.PENDING;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${s.cls}`}>
            {s.icon} {status}
        </span>
    );
}

// ---- Generate Key Modal ----
function GenerateKeyModal({
    open, onClose, onCreated,
}: {
    open: boolean;
    onClose: () => void;
    onCreated: (k: ApiKeyCreated) => void;
}) {
    const { user } = useAuth();
    const [label, setLabel] = useState("");
    const [plan, setPlan] = useState("free");
    const [loading, setLoading] = useState(false);
    const [createdKey, setCreatedKey] = useState<ApiKeyCreated | null>(null);
    const [copied, setCopied] = useState(false);

    const handleCreate = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const key = await apiKeysApi.create(user.token, label || undefined, plan);
            setCreatedKey(key);
            onCreated(key);
            toast({ title: "API Key generated!" });
        } catch (err: any) {
            toast({ title: "Failed to create key", description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (createdKey) {
            navigator.clipboard.writeText(createdKey.key);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleClose = () => {
        setLabel("");
        setPlan("free");
        setCreatedKey(null);
        setCopied(false);
        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={handleClose}>
            <div className="glass rounded-2xl p-8 max-w-md w-full mx-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                {!createdKey ? (
                    <>
                        <h2 className="text-xl font-bold mb-4">Generate API Key</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Label (optional)</label>
                                <input
                                    type="text"
                                    value={label}
                                    onChange={(e) => setLabel(e.target.value)}
                                    placeholder="e.g. Production, Testing"
                                    className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Plan</label>
                                <select
                                    value={plan}
                                    onChange={(e) => setPlan(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border focus:border-primary outline-none transition-all text-sm"
                                >
                                    <option value="free">Free (10 req/min)</option>
                                    <option value="pro">Pro (50 req/min)</option>
                                    <option value="enterprise">Enterprise (200 req/min)</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={handleClose} className="flex-1 py-2.5 rounded-lg border border-border hover:bg-secondary transition-colors text-sm">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={loading}
                                    className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                                >
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Generate
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="text-center mb-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
                                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                            </div>
                            <h2 className="text-xl font-bold">Key Created!</h2>
                        </div>
                        <div className="bg-secondary rounded-lg p-4 mb-4">
                            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Your API Key (shown once)</p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 text-sm text-emerald-400 break-all select-all font-mono">{createdKey.key}</code>
                                <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-white/5 transition-colors shrink-0">
                                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                                </button>
                            </div>
                        </div>
                        <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs mb-4">
                            <strong>Warning:</strong> Store this key securely. You will not be able to see it again.
                        </div>
                        <button onClick={handleClose} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity text-sm">
                            Done
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

// ---- Job History Modal ----
function JobHistoryModal({
    open, onClose, jobId,
}: {
    open: boolean;
    onClose: () => void;
    jobId: string | null;
}) {
    const { user } = useAuth();
    const [history, setHistory] = useState<JobHistoryEntry[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !jobId || !user) return;
        setLoading(true);
        jobsApi.history(user.token, jobId)
            .then(setHistory)
            .catch((err: any) => toast({ title: "Failed to load history", description: err.message, variant: "destructive" }))
            .finally(() => setLoading(false));
    }, [open, jobId, user]);

    if (!open || !jobId) return null;

    const statusColors: Record<string, string> = {
        PENDING: "border-amber-500/40 bg-amber-500/10 text-amber-300",
        PROCESSING: "border-blue-500/40 bg-blue-500/10 text-blue-300",
        SUCCESS: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
        FAILED: "border-red-500/40 bg-red-500/10 text-red-300",
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="glass rounded-2xl p-8 max-w-lg w-full mx-4 animate-fade-in max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <History className="w-5 h-5 text-primary" /> Job History
                        </h2>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">{jobId.slice(0, 8)}...</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : history.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No history recorded</p>
                ) : (
                    <div className="overflow-y-auto flex-1 pr-1 space-y-0">
                        {history.map((entry, i) => (
                            <div key={entry.id} className="relative pl-8 pb-6">
                                {/* Timeline line */}
                                {i < history.length - 1 && (
                                    <div className="absolute left-[11px] top-6 w-0.5 h-full bg-border" />
                                )}
                                {/* Timeline dot */}
                                <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center border ${statusColors[entry.status] || statusColors.PENDING}`}>
                                    <div className="w-2 h-2 rounded-full bg-current" />
                                </div>
                                {/* Content */}
                                <div className="pt-0.5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <StatusBadge status={entry.status} />
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(entry.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    {entry.details && (
                                        <p className="text-sm text-muted-foreground mt-1 break-all">{entry.details}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ---- Main Dashboard ----
export default function DashboardPage() {
    const { user, logout, isLoading } = useAuth();
    const router = useRouter();
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [activeTab, setActiveTab] = useState<"keys" | "jobs" | "webhook">("keys");
    const [revokingId, setRevokingId] = useState<string | null>(null);

    // Webhook state
    const [webhook, setWebhook] = useState<Webhook | null>(null);
    const [webhookUrl, setWebhookUrl] = useState("");
    const [savingWebhook, setSavingWebhook] = useState(false);
    const [deletingWebhook, setDeletingWebhook] = useState(false);

    // Job history modal
    const [historyJobId, setHistoryJobId] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        if (!user) return;
        setLoadingData(true);
        try {
            const [k, j, w] = await Promise.all([
                apiKeysApi.list(user.token),
                jobsApi.list(user.token),
                webhookApi.get(user.token).catch(() => null),
            ]);
            setKeys(k);
            setJobs(j);
            if (w) {
                setWebhook(w);
                setWebhookUrl(w.url);
            }
        } catch (err: any) {
            toast({ title: "Failed to load data", description: err.message, variant: "destructive" });
        } finally {
            setLoadingData(false);
        }
    }, [user]);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/auth/login");
            return;
        }
        if (user) loadData();
    }, [user, isLoading, router, loadData]);

    const handleRevoke = async (keyId: string) => {
        if (!user) return;
        setRevokingId(keyId);
        try {
            await apiKeysApi.revoke(user.token, keyId);
            setKeys((prev) => prev.map((k) => (k.id === keyId ? { ...k, isActive: false, revokedAt: new Date().toISOString() } : k)));
            toast({ title: "Key revoked" });
        } catch (err: any) {
            toast({ title: "Failed to revoke", description: err.message, variant: "destructive" });
        } finally {
            setRevokingId(null);
        }
    };

    const handleSaveWebhook = async () => {
        if (!user || !webhookUrl.trim()) return;
        setSavingWebhook(true);
        try {
            const w = await webhookApi.set(user.token, webhookUrl.trim());
            setWebhook(w);
            setWebhookUrl(w.url);
            toast({ title: "Webhook saved" });
        } catch (err: any) {
            toast({ title: "Failed to save webhook", description: err.message, variant: "destructive" });
        } finally {
            setSavingWebhook(false);
        }
    };

    const handleDeleteWebhook = async () => {
        if (!user) return;
        setDeletingWebhook(true);
        try {
            await webhookApi.delete(user.token);
            setWebhook(null);
            setWebhookUrl("");
            toast({ title: "Webhook removed" });
        } catch (err: any) {
            toast({ title: "Failed to remove webhook", description: err.message, variant: "destructive" });
        } finally {
            setDeletingWebhook(false);
        }
    };

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const activeKeys = keys.filter((k) => k.isActive).length;
    const successJobs = jobs.filter((j) => j.status === "SUCCESS").length;
    const processingJobs = jobs.filter((j) => j.status === "PROCESSING" || j.status === "PENDING").length;

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="border-b border-border">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold gradient-text">Omni3D</h1>
                        <span className="text-xs px-2 py-0.5 rounded-full glass text-muted-foreground">Dashboard</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{user.email}</span>
                        <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground" title="Sign out">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-fade-in">
                    {[
                        { label: "Active Keys", value: activeKeys, icon: <Key className="w-5 h-5 text-primary" /> },
                        { label: "Completed Jobs", value: successJobs, icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" /> },
                        { label: "In Progress", value: processingJobs, icon: <Loader2 className="w-5 h-5 text-blue-400" /> },
                    ].map((s) => (
                        <div key={s.label} className="glass rounded-xl p-5 flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-secondary">{s.icon}</div>
                            <div>
                                <p className="text-2xl font-bold">{s.value}</p>
                                <p className="text-sm text-muted-foreground">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 mb-6 bg-secondary rounded-lg p-1 w-fit">
                    {([
                        { key: "keys", label: "API Keys" },
                        { key: "jobs", label: "Jobs" },
                        { key: "webhook", label: "Webhook" },
                    ] as const).map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.key
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                    <button onClick={loadData} className="ml-2 p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors" title="Refresh">
                        <RefreshCw className={`w-4 h-4 ${loadingData ? "animate-spin" : ""}`} />
                    </button>
                </div>

                {/* API Keys Tab */}
                {activeTab === "keys" && (
                    <div className="animate-fade-in">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">API Keys</h2>
                            <button
                                onClick={() => setShowKeyModal(true)}
                                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Generate Key
                            </button>
                        </div>

                        {loadingData ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : keys.length === 0 ? (
                            <div className="text-center py-16 glass rounded-xl">
                                <Key className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                                <p className="text-muted-foreground mb-4">No API keys yet</p>
                                <button
                                    onClick={() => setShowKeyModal(true)}
                                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                                >
                                    Generate Your First Key
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {keys.map((k, i) => (
                                    <div
                                        key={k.id}
                                        className={`glass rounded-xl p-5 flex items-center justify-between animate-slide-in ${!k.isActive ? "opacity-50" : ""}`}
                                        style={{ animationDelay: `${i * 0.05}s` }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2.5 rounded-lg ${k.isActive ? "bg-primary/10" : "bg-secondary"}`}>
                                                <Key className={`w-4 h-4 ${k.isActive ? "text-primary" : "text-muted-foreground"}`} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <code className="text-sm font-mono">{k.keyPrefix}</code>
                                                    {k.label && <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{k.label}</span>}
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    <span className="uppercase font-medium">{k.planName}</span>
                                                    <span>Created {new Date(k.createdAt).toLocaleDateString()}</span>
                                                    {k.revokedAt && <span className="text-red-400">Revoked {new Date(k.revokedAt).toLocaleDateString()}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        {k.isActive && (
                                            <button
                                                onClick={() => handleRevoke(k.id)}
                                                disabled={revokingId === k.id}
                                                className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                                title="Revoke key"
                                            >
                                                {revokingId === k.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Jobs Tab */}
                {activeTab === "jobs" && (
                    <div className="animate-fade-in">
                        <h2 className="text-lg font-semibold mb-4">Generation Jobs</h2>

                        {loadingData ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : jobs.length === 0 ? (
                            <div className="text-center py-16 glass rounded-xl">
                                <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                                <p className="text-muted-foreground">No jobs yet. Submit your first 3D generation request via the API.</p>
                            </div>
                        ) : (
                            <div className="overflow-hidden glass rounded-xl">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border text-left">
                                            <th className="px-5 py-3 font-medium text-muted-foreground">Job ID</th>
                                            <th className="px-5 py-3 font-medium text-muted-foreground">Status</th>
                                            <th className="px-5 py-3 font-medium text-muted-foreground">Created</th>
                                            <th className="px-5 py-3 font-medium text-muted-foreground">Completed</th>
                                            <th className="px-5 py-3 font-medium text-muted-foreground">Output</th>
                                            <th className="px-5 py-3 font-medium text-muted-foreground"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {jobs.map((j, i) => (
                                            <tr key={j.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors animate-slide-in" style={{ animationDelay: `${i * 0.03}s` }}>
                                                <td className="px-5 py-3">
                                                    <code className="text-xs font-mono text-muted-foreground">{j.id.slice(0, 8)}...</code>
                                                </td>
                                                <td className="px-5 py-3"><StatusBadge status={j.status} /></td>
                                                <td className="px-5 py-3 text-muted-foreground">{new Date(j.createdAt).toLocaleString()}</td>
                                                <td className="px-5 py-3 text-muted-foreground">{j.completedAt ? new Date(j.completedAt).toLocaleString() : "-"}</td>
                                                <td className="px-5 py-3">
                                                    {j.status === "SUCCESS" && j.outputGlbUrl ? (
                                                        <div className="flex gap-2">
                                                            <a href={j.outputGlbUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 rounded bg-secondary hover:bg-white/5 transition-colors">.glb</a>
                                                            {j.outputUsdzUrl && (
                                                                <a href={j.outputUsdzUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 rounded bg-secondary hover:bg-white/5 transition-colors">.usdz</a>
                                                            )}
                                                        </div>
                                                    ) : j.status === "FAILED" ? (
                                                        <span className="text-xs text-red-400" title={j.errorMessage || undefined}>Error</span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <button
                                                        onClick={() => setHistoryJobId(j.id)}
                                                        className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                                                        title="View history"
                                                    >
                                                        <History className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Webhook Tab */}
                {activeTab === "webhook" && (
                    <div className="animate-fade-in">
                        <h2 className="text-lg font-semibold mb-4">Webhook Configuration</h2>

                        <div className="glass rounded-xl p-6 max-w-xl">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="p-3 rounded-lg bg-primary/10">
                                    <WebhookIcon className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-medium mb-1">Delivery URL</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Configure a single webhook URL to receive status updates for all your 3D generation jobs. We&apos;ll send a POST request with the job result when processing completes.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Webhook URL</label>
                                    <input
                                        type="url"
                                        value={webhookUrl}
                                        onChange={(e) => setWebhookUrl(e.target.value)}
                                        placeholder="https://your-app.com/webhook"
                                        className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-mono"
                                    />
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleSaveWebhook}
                                        disabled={savingWebhook || !webhookUrl.trim()}
                                        className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {savingWebhook ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {webhook ? "Update" : "Save"}
                                    </button>
                                    {webhook && (
                                        <button
                                            onClick={handleDeleteWebhook}
                                            disabled={deletingWebhook}
                                            className="px-4 py-2.5 rounded-lg border border-border text-sm hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors flex items-center gap-2"
                                        >
                                            {deletingWebhook ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            Remove
                                        </button>
                                    )}
                                </div>

                                {webhook && (
                                    <div className="mt-4 p-4 rounded-lg bg-secondary/50 border border-border/50">
                                        <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Webhook Payload Example</p>
                                        <pre className="text-xs text-emerald-400 font-mono overflow-x-auto">{JSON.stringify({
                                            jobId: "uuid-...",
                                            status: "SUCCESS",
                                            outputGlbUrl: "https://r2.../model.glb",
                                            outputUsdzUrl: "https://r2.../model.usdz"
                                        }, null, 2)}</pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <GenerateKeyModal
                open={showKeyModal}
                onClose={() => setShowKeyModal(false)}
                onCreated={(k) => {
                    setKeys((prev) => [
                        { id: k.id, keyPrefix: k.key.slice(0, 16) + "...", label: k.label, planName: k.planName, isActive: true, createdAt: k.createdAt, revokedAt: null },
                        ...prev,
                    ]);
                }}
            />

            <JobHistoryModal
                open={!!historyJobId}
                onClose={() => setHistoryJobId(null)}
                jobId={historyJobId}
            />
        </div>
    );
}
