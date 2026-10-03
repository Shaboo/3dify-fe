"use client";

import Link from "next/link";
import { XCircle } from "lucide-react";

export default function SubscribeCancelPage() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="text-center max-w-md animate-fade-in">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
                        <XCircle className="w-12 h-12 text-red-400" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold mb-3">Payment cancelled</h1>
                <p className="text-muted-foreground mb-8">
                    No charge was made. You can choose a plan whenever you&apos;re ready.
                </p>
                <div className="flex gap-3 justify-center">
                    <Link
                        href="/subscribe"
                        className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                    >
                        View Plans
                    </Link>
                    <Link
                        href="/dashboard"
                        className="px-6 py-3 rounded-xl border border-border hover:bg-white/5 transition-colors font-medium"
                    >
                        Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
