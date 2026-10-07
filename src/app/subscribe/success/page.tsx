"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Header, PageTitle } from "@/components/shell";
import { useAuth } from "@/lib/auth-context";
import { subscriptionApi, errorMessage } from "@/lib/api";
export default function Success() {
  const { user } = useAuth();
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!user) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const check = async () => {
      try {
        const status = await subscriptionApi.getStatus(user.token);
        if (alive) {
          setActive(status.isActive);
          setError("");
          if (!status.isActive) timer = setTimeout(check, 3000);
        }
      } catch (error) {
        if (alive) setError(errorMessage(error));
      }
    };
    check();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [user]);
  return (
    <>
      <Header />
      <main className="public-page">
        <PageTitle
          title={
            active ? "Your workspace is ready." : "Checking your subscription."
          }
          description={
            active
              ? "Your plan is active. You can now submit a generation task."
              : "Payment updates can take a moment to reach the backend."
          }
        />
        {error && (
          <div className="note error" role="alert">
            {error}
          </div>
        )}
        <Link className="btn" href={user ? "/dashboard" : "/auth/login"}>
          {user ? "Open workspace" : "Sign in"}
        </Link>
      </main>
    </>
  );
}
