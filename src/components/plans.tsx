"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  plansApi,
  subscriptionApi,
  Plan,
  errorMessage,
  formatPrice,
} from "@/lib/api";
export function Plans() {
  const { user } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    plansApi
      .listActive()
      .then((plans) => {
        if (alive) {
          setPlans(plans.sort((a, b) => a.sortOrder - b.sortOrder));
          setError("");
        }
      })
      .catch((error) => {
        if (alive) setError(errorMessage(error));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [revision]);
  async function choose(plan: Plan) {
    if (!user) {
      router.push("/auth/register");
      return;
    }
    if (busy) return;
    setBusy(plan.id);
    setError("");
    try {
      const { checkoutUrl } = await subscriptionApi.createCheckout(
        user.token,
        plan.id,
        `${location.origin}/subscribe/success`,
        `${location.origin}/subscribe/cancel`,
      );
      location.assign(checkoutUrl);
    } catch (error) {
      setError(errorMessage(error));
      setBusy(null);
    }
  }
  return (
    <>
      {error && (
        <div className="note error" role="alert" style={{ marginBottom: 24 }}>
          <p>{error}</p>
          <button
            className="btn secondary small"
            onClick={() => setRevision((value) => value + 1)}
            style={{ marginTop: 12 }}
          >
            Reload plans
          </button>
        </div>
      )}
      {loading ? (
        <p role="status">Loading plans…</p>
      ) : plans.length ? (
        <div className="plans-grid">
          {plans.map((plan, index) => (
            <section className="plan-card" key={plan.id}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <h2>{plan.displayName || plan.name}</h2>
                <span className="photo-num">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              {plan.description && <p className="muted">{plan.description}</p>}
              <div>
                <p className="plan-price">
                  {plan.priceCents === 0
                    ? "Free"
                    : formatPrice(plan.priceCents, plan.currency)}
                </p>
                {plan.priceCents > 0 && <small>per month</small>}
              </div>
              <ul>
                <li>
                  {plan.monthlyQuota.toLocaleString()} monthly jobs in this plan
                </li>
                <li>
                  {plan.rateLimitRpm.toLocaleString()} API requests per minute
                </li>
                <li>Job history and API access</li>
              </ul>
              <button
                className="btn full"
                disabled={!!busy}
                onClick={() => choose(plan)}
              >
                {busy === plan.id
                  ? "Opening…"
                  : plan.priceCents === 0
                    ? "Activate free plan"
                    : "Choose plan"}
                <ArrowRight size={16} />
              </button>
            </section>
          ))}
        </div>
      ) : !error ? (
        <div className="empty">No active plans are available.</div>
      ) : null}
      <p className="muted" style={{ marginTop: 24, fontSize: 13 }}>
        Generation provider credits are separate from your website subscription.{" "}
        <Link href="/dashboard" className="text-link">
          Open the workspace
        </Link>
      </p>
    </>
  );
}
