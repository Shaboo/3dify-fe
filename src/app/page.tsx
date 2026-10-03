"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { plansApi, type Plan } from "@/lib/api";
import {
    ArrowRight, Box, Check, ChevronRight, Code2, Globe,
    Layers, Loader2, Zap, Shield, Clock, Star, Github, Twitter
} from "lucide-react";

const HOW_IT_WORKS = [
    {
        step: "01",
        title: "Get your API key",
        desc: "Sign up for free, choose a plan, and grab your API key from the dashboard in under 2 minutes.",
    },
    {
        step: "02",
        title: "Upload two images",
        desc: "Send two perspective shots of your object via a simple POST request. Any format, any product.",
    },
    {
        step: "03",
        title: "Download GLB + USDZ",
        desc: "Receive optimized 3D models ready for AR Quick Look, Three.js, Babylon.js, and more.",
    },
];

const FEATURES = [
    { icon: Zap, title: "Sub-60s generation", desc: "Industry-leading inference latency on dedicated GPU clusters." },
    { icon: Globe, title: "GLB & USDZ output", desc: "Every job produces both web-friendly GLB and iOS AR-ready USDZ." },
    { icon: Code2, title: "Simple REST API", desc: "Integrate in minutes with any language or framework. SDKs coming soon." },
    { icon: Shield, title: "Webhook delivery", desc: "Receive job completion events via HTTPS webhooks to your endpoint." },
    { icon: Layers, title: "Job history", desc: "Full audit trail of every generation with downloadable output links." },
    { icon: Clock, title: "Async by default", desc: "Fire-and-forget job submission with polling and webhook support." },
];

const LOGOS = ["Shopify", "Wix", "Webflow", "Unity", "Unreal", "Three.js"];

function formatPrice(priceCents: number, currency: string) {
    if (priceCents === 0) return "Free";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
        minimumFractionDigits: 0,
    }).format(priceCents / 100);
}

const PLAN_FEATURES: Record<string, string[]> = {
    free: ["100 jobs/month", "10 req/min", "GLB + USDZ", "Job history"],
    pro: ["2,000 jobs/month", "50 req/min", "GLB + USDZ", "Webhooks", "Priority queue"],
    enterprise: ["50,000 jobs/month", "200 req/min", "GLB + USDZ", "Webhooks", "SLA guarantee", "Priority support"],
};

export default function LandingPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(true);

    useEffect(() => {
        if (!isLoading && user) router.push("/dashboard");
    }, [user, isLoading, router]);

    useEffect(() => {
        plansApi.listActive()
            .then(setPlans)
            .catch(() => { })
            .finally(() => setLoadingPlans(false));
    }, []);

    return (
        <div className="min-h-screen">
            {/* ─── Nav ─── */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
                <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
                    <Link href="/" className="text-lg font-bold gradient-text">Omni3D</Link>
                    <div className="flex items-center gap-3">
                        <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Sign in
                        </Link>
                        <Link
                            href="/auth/register"
                            className="text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
                        >
                            Get started free
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ─── Hero ─── */}
            <section className="pt-32 pb-20 px-4 text-center relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

                <div className="max-w-3xl mx-auto animate-fade-in">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium mb-6">
                        <Box className="w-3.5 h-3.5" />
                        2D to 3D in under 60 seconds
                    </div>

                    <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-5">
                        Turn photos into<br />
                        <span className="gradient-text">3D models via API</span>
                    </h1>

                    <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
                        The fastest generative 3D API on the market. Upload two images, get production-ready GLB and USDZ files — ready for AR, e-commerce, and gaming.
                    </p>

                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <Link
                            href="/auth/register"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity text-sm"
                        >
                            Start for free <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                            href="#pricing"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border hover:bg-white/5 transition-colors font-medium text-sm"
                        >
                            View pricing
                        </Link>
                    </div>

                    {/* Code snippet */}
                    <div className="mt-12 glass rounded-2xl p-5 text-left max-w-xl mx-auto animate-slide-in">
                        <div className="flex items-center gap-1.5 mb-3">
                            <div className="w-3 h-3 rounded-full bg-red-400/70" />
                            <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
                            <div className="w-3 h-3 rounded-full bg-emerald-400/70" />
                        </div>
                        <pre className="text-xs text-muted-foreground overflow-x-auto">
                            {`curl -X POST https://api.omni3d.io/api/v1/generate \\
  -H "X-API-KEY: om3d_••••••••••••" \\
  -F "image1=@front.jpg" \\
  -F "image2=@side.jpg"

# → { "jobId": "abc-123", "status": "PENDING" }`}
                        </pre>
                    </div>
                </div>
            </section>

            {/* ─── Social proof ─── */}
            <section className="py-12 border-y border-border/50 bg-secondary/20">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-6">Trusted by teams building on</p>
                    <div className="flex items-center justify-center gap-8 flex-wrap">
                        {LOGOS.map((logo) => (
                            <span key={logo} className="text-muted-foreground/50 font-semibold text-sm">{logo}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── How it works ─── */}
            <section id="how-it-works" className="py-20 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-3">Dead simple integration</h2>
                        <p className="text-muted-foreground">Three steps from signup to your first 3D model.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {HOW_IT_WORKS.map((item, i) => (
                            <div key={item.step} className="glass rounded-2xl p-6 relative animate-slide-in" style={{ animationDelay: `${i * 0.1}s` }}>
                                <span className="text-4xl font-black text-primary/20">{item.step}</span>
                                <h3 className="text-base font-semibold mt-2 mb-2">{item.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                                {i < HOW_IT_WORKS.length - 1 && (
                                    <ChevronRight className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground/30 hidden md:block" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Features ─── */}
            <section id="features" className="py-20 px-4 bg-secondary/10">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-3">Everything you need</h2>
                        <p className="text-muted-foreground">Built for developers who care about reliability and speed.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {FEATURES.map((f, i) => (
                            <div key={f.title} className="glass rounded-xl p-5 animate-slide-in" style={{ animationDelay: `${i * 0.07}s` }}>
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                                    <f.icon className="w-5 h-5 text-primary" />
                                </div>
                                <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Pricing ─── */}
            <section id="pricing" className="py-20 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-3">Transparent pricing</h2>
                        <p className="text-muted-foreground">Start free, scale without surprises.</p>
                    </div>

                    {loadingPlans ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {plans.map((plan, i) => {
                                const isPopular = plan.name === "pro";
                                const features = PLAN_FEATURES[plan.name] || [];
                                return (
                                    <div
                                        key={plan.id}
                                        className={`relative rounded-2xl p-7 flex flex-col animate-slide-in ${isPopular ? "border-2 border-primary bg-primary/5" : "glass"}`}
                                        style={{ animationDelay: `${i * 0.1}s` }}
                                    >
                                        {isPopular && (
                                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1">
                                                <Star className="w-3 h-3" fill="currentColor" /> Most Popular
                                            </div>
                                        )}
                                        <h3 className="font-bold text-lg mb-1">{plan.displayName || plan.name}</h3>
                                        <p className="text-xs text-muted-foreground mb-4 min-h-[32px]">{plan.description}</p>
                                        <div className="mb-5">
                                            <span className="text-3xl font-black">{formatPrice(plan.priceCents, plan.currency)}</span>
                                            {plan.priceCents > 0 && <span className="text-muted-foreground text-sm ml-1">/month</span>}
                                        </div>
                                        <ul className="space-y-2 mb-7 flex-1">
                                            {features.map((feat) => (
                                                <li key={feat} className="flex items-center gap-2 text-sm">
                                                    <Check className="w-4 h-4 text-emerald-400 shrink-0" /> {feat}
                                                </li>
                                            ))}
                                        </ul>
                                        <Link
                                            href="/auth/register"
                                            className={`w-full py-2.5 rounded-xl text-center font-medium text-sm transition-all ${isPopular ? "bg-primary text-primary-foreground hover:opacity-90" : "border border-border hover:bg-white/5"}`}
                                        >
                                            {plan.priceCents === 0 ? "Start free" : "Get started"}
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* ─── CTA ─── */}
            <section className="py-20 px-4 text-center">
                <div className="max-w-xl mx-auto glass rounded-3xl p-10 animate-fade-in">
                    <h2 className="text-3xl font-bold mb-3">Ready to go 3D?</h2>
                    <p className="text-muted-foreground mb-7">
                        Join developers generating thousands of 3D models every day. No credit card required to start.
                    </p>
                    <Link
                        href="/auth/register"
                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
                    >
                        Create free account <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>

            {/* ─── Footer ─── */}
            <footer className="border-t border-border/50 py-10 px-4">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                    <Link href="/" className="font-bold gradient-text text-base">Omni3D</Link>
                    <div className="flex gap-6">
                        <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
                        <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
                        <Link href="/auth/login" className="hover:text-foreground transition-colors">Login</Link>
                    </div>
                    <p>© {new Date().getFullYear()} Omni3D. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
