"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function SubscribeSuccessPage() {
    const router = useRouter();

    useEffect(() => {
        const t = setTimeout(() => router.push("/dashboard"), 5000);
        return () => clearTimeout(t);
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="text-center max-w-md animate-fade-in">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold mb-3">You&apos;re all set! 🎉</h1>
                <p className="text-muted-foreground mb-2">
                    Your subscription is now active. You&apos;ll be redirected to the dashboard in a few seconds.
                </p>
                <p className="text-sm text-muted-foreground mb-8">
                    API keys will now use your new plan&apos;s rate limits automatically.
                </p>
                <Link
                    href="/dashboard"
                    className="inline-flex items-center px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                >
                    Go to Dashboard →
                </Link>
            </div>
        </div>
    );
}
