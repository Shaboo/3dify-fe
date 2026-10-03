"use client";

import Link from "next/link";
import { ArrowLeft, Box } from "lucide-react";

export default function DocsPage() {
    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            {/* Nav */}
            <nav className="border-b border-border/50 bg-background/80 backdrop-blur-lg sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>
                    <div className="text-sm font-bold gradient-text">Omni3D Docs</div>
                </div>
            </nav>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-4 pt-12 animate-fade-in">
                <h1 className="text-4xl font-extrabold mb-4 tracking-tight">API Reference</h1>
                <p className="text-lg text-muted-foreground mb-12">
                    Integrate state-of-the-art 3D model generation into your applications.
                </p>

                <div className="space-y-16">
                    {/* Auth Section */}
                    <section>
                        <h2 className="text-2xl font-bold border-b border-border/50 pb-2 mb-6">Authentication</h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            Omni3D uses <strong className="text-foreground">API Keys</strong> to authenticate requests. You can generate and manage your API keys from the <Link href="/dashboard/api-keys" className="text-primary hover:underline">Dashboard</Link>.
                        </p>
                        <div className="glass rounded-xl p-4 border-l-4 border-l-yellow-500/50 mb-4 bg-yellow-500/5">
                            <p className="text-sm text-yellow-500/90 font-medium">Important</p>
                            <p className="text-xs text-muted-foreground mt-1">Keep your API keys secure. Always make requests to Omni3D from your secure backend servers, never from client-side code.</p>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">All API requests must include your API key in the header:</p>
                        <pre className="bg-secondary/30 border border-border/50 p-4 rounded-xl text-xs overflow-x-auto text-primary/90 font-mono">
                            X-API-KEY: omni_pk_1234567890abcdef...
                        </pre>
                    </section>

                    {/* Generate Model Section */}
                    <section>
                        <h2 className="text-2xl font-bold border-b border-border/50 pb-2 mb-6">Generate 3D Model</h2>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded text-xs font-bold font-mono">POST</span>
                            <code className="text-sm font-mono text-muted-foreground">/api/v1/generate</code>
                        </div>
                        <p className="text-sm text-muted-foreground mb-6">
                            Submit exactly two images (e.g., front and back) as a <code className="text-foreground bg-secondary/50 px-1 py-0.5 rounded">multipart/form-data</code> request. The process is asynchronous.
                        </p>

                        <h3 className="text-sm font-semibold mb-3 tracking-wide uppercase text-muted-foreground">Request Example (cURL)</h3>
                        <pre className="bg-secondary/30 border border-border/50 p-4 rounded-xl text-xs overflow-x-auto text-primary/90 font-mono mb-8">
                            {`curl -X POST https://api.omni3d.com/api/v1/generate \\
  -H "X-API-KEY: your_api_key_here" \\
  -F "image1=@/path/to/front.jpg" \\
  -F "image2=@/path/to/back.jpg"`}
                        </pre>

                        <h3 className="text-sm font-semibold mb-3 tracking-wide uppercase text-muted-foreground">Response (202 Accepted)</h3>
                        <pre className="bg-secondary/30 border border-border/50 p-4 rounded-xl text-xs overflow-x-auto text-primary/90 font-mono">
                            {`{
  "jobId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "status": "PENDING"
}`}
                        </pre>
                    </section>

                    {/* Check Status Section */}
                    <section>
                        <h2 className="text-2xl font-bold border-b border-border/50 pb-2 mb-6">Retrieve Job Status</h2>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-blue-500/10 text-blue-500 px-2.5 py-1 rounded text-xs font-bold font-mono">GET</span>
                            <code className="text-sm font-mono text-muted-foreground">/api/v1/jobs/&lcub;jobId&rcub;</code>
                        </div>
                        <p className="text-sm text-muted-foreground mb-6">
                            Poll this endpoint to check if your model is ready. Once <code className="text-foreground">status === "SUCCESS"</code>, you will receive the download URLs.
                        </p>

                        <h3 className="text-sm font-semibold mb-3 tracking-wide uppercase text-muted-foreground">Response Example (Success)</h3>
                        <pre className="bg-secondary/30 border border-border/50 p-4 rounded-xl text-xs overflow-x-auto text-primary/90 font-mono">
                            {`{
  "jobId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "status": "SUCCESS",
  "outputGlbUrl": "https://cdn.omni3d.com/outputs/.../model.glb",
  "outputUsdzUrl": "https://cdn.omni3d.com/outputs/.../model.usdz",
  "createdAt": "2026-02-22T12:00:00Z",
  "completedAt": "2026-02-22T12:00:05Z"
}`}
                        </pre>
                    </section>

                    {/* Webhooks Section */}
                    <section>
                        <h2 className="text-2xl font-bold border-b border-border/50 pb-2 mb-6 flex items-center gap-2">
                            <Box className="w-5 h-5" /> Webhooks (Recommended)
                        </h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            Instead of polling, configure a Webhook URL in your dashboard. Omni3D will POST the job status payload to your server the moment generation is complete.
                        </p>
                        <p className="text-sm text-muted-foreground mb-6">
                            Your endpoint should return an HTTP <code className="text-foreground">2xx</code> status immediately upon receipt to prevent retries.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}
