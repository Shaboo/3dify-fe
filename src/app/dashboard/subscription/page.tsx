"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Workspace, PageTitle } from "@/components/shell";
import { Plans } from "@/components/plans";
import { useAuth } from "@/lib/auth-context";
import {
  subscriptionApi,
  SubscriptionStatus,
  errorMessage,
  formatDate,
  formatPrice,
} from "@/lib/api";
function Subscription() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!user) return;
    let alive = true;
    subscriptionApi
      .getStatus(user.token)
      .then((status) => {
        if (alive) {
          setStatus(status);
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
  }, [user, revision]);
  async function portal() {
    if (!user || busy) return;
    setBusy(true);
    try {
      const result = await subscriptionApi.createPortal(
        user.token,
        `${location.origin}/dashboard/subscription`,
      );
      location.assign(result.portalUrl);
    } catch (error) {
      setError(errorMessage(error));
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        title="Subscription"
        description="Manage your website plan. Shopify billing is handled separately."
      />
      {error && (
        <div className="note error" role="alert" style={{ marginBottom: 20 }}>
          {error}
          <button
            className="btn secondary small"
            style={{ marginTop: 12 }}
            onClick={() => setRevision((value) => value + 1)}
          >
            Retry
          </button>
        </div>
      )}
      <section className="panel" style={{ marginBottom: 32 }}>
        {loading ? (
          <p role="status">Loading subscription…</p>
        ) : (
          <div className="panel-head" style={{ marginBottom: 0 }}>
            <div>
              <h2>
                {status?.displayName || status?.planName || "No subscription"}
              </h2>
              <p className="muted" style={{ marginTop: 8 }}>
                {status?.status ||
                  "Choose a plan below to activate your workspace."}
                {status?.currentPeriodEnd
                  ? ` · Period ends ${formatDate(status.currentPeriodEnd)}`
                  : ""}
              </p>
              {status?.priceCents != null && status.priceCents === 0 && (
                <p style={{ marginTop: 8 }}>No card required.</p>
              )}
            </div>
            {!!status?.priceCents && status.priceCents > 0 && (
              <button
                className="btn secondary"
                onClick={portal}
                disabled={busy}
              >
                {busy ? "Opening…" : "Manage billing"}
                <ArrowUpRight size={16} />
              </button>
            )}
          </div>
        )}
      </section>
      <Plans />
    </>
  );
}
export default function SubscriptionPage() {
  return (
    <Workspace>
      <Subscription />
    </Workspace>
  );
}
