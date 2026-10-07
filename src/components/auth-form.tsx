"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Header } from "@/components/shell";
import { useAuth } from "@/lib/auth-context";
import { authApi, errorMessage } from "@/lib/api";
export function AuthForm({ register = false }: { register?: boolean }) {
  const { user, login, isLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!isLoading && user) router.replace("/dashboard");
  }, [user, isLoading, router]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const result = register
        ? await authApi.register(
            String(data.get("email")).trim(),
            String(data.get("password")),
            String(data.get("name")).trim(),
          )
        : await authApi.login(
            String(data.get("email")).trim(),
            String(data.get("password")),
          );
      login(result.token, result.userId, result.email, result.isAdmin);
      router.replace("/dashboard");
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Header />
      <main className="auth-layout">
        <section className="auth-story">
          <div>
            <h1>
              From photos
              <br />
              to{" "}
              <span className="blue">
                something
                <br />
                you can turn.
              </span>
            </h1>
            <p>
              Your generation workspace, job history, and downloads in one
              place.
            </p>
          </div>
          <span className="section-number" aria-hidden="true">
            {register ? "01" : "02"}
          </span>
        </section>
        <section className="auth-form">
          <h2>{register ? "Create an account" : "Welcome back"}</h2>
          <p className="muted">
            {register
              ? "Start with your photos. No Shopify store required."
              : "Sign in to generate and follow your jobs."}
          </p>
          <form onSubmit={submit}>
            {register && (
              <div className="field">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  name="name"
                  autoComplete="name"
                  maxLength={100}
                />
              </div>
            )}
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={register ? "new-password" : "current-password"}
                minLength={register ? 8 : undefined}
                required
              />
              {register && <small>Use at least 8 characters.</small>}
            </div>
            {error && (
              <div className="note error" role="alert">
                {error}
              </div>
            )}
            <button className="btn full" disabled={busy}>
              {busy ? (
                <Loader2 size={18} className="spin" />
              ) : register ? (
                "Create account"
              ) : (
                "Sign in"
              )}
              <ArrowRight size={18} />
            </button>
          </form>
          <p className="muted" style={{ marginTop: 28 }}>
            {register ? "Already have an account? " : "New to 3dify? "}
            <Link
              className="text-link"
              href={register ? "/auth/login" : "/auth/register"}
            >
              {register ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </section>
      </main>
    </>
  );
}
