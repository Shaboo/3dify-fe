"use client";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Workspace, PageTitle } from "@/components/shell";
import { useAuth } from "@/lib/auth-context";
import { webhookApi, errorMessage } from "@/lib/api";
import { toast } from "@/components/ui/toaster";
function Webhooks() {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!user) return;
    let alive = true;
    setLoading(true);
    webhookApi
      .get(user.token)
      .then((value) => {
        if (alive) {
          setUrl(value?.url || "");
          setSaved(value?.url || "");
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
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!user || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await webhookApi.set(user.token, url.trim());
      setSaved(result.url);
      setUrl(result.url);
      toast({ title: "Webhook saved" });
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!user || busy) return;
    setBusy(true);
    setError("");
    try {
      await webhookApi.delete(user.token);
      setUrl("");
      setSaved("");
      toast({ title: "Webhook removed" });
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        title="Webhooks"
        description="Receive generation updates at your own endpoint."
      />
      <section className="panel" style={{ maxWidth: 780 }}>
        <h2>Delivery endpoint</h2>
        <p className="muted" style={{ marginTop: 12 }}>
          The backend sends job updates to the URL configured for your account.
        </p>
        {loading ? (
          <p role="status" style={{ marginTop: 24 }}>
            Loading webhook…
          </p>
        ) : (
          <form className="stack" onSubmit={save} style={{ marginTop: 28 }}>
            <div className="field">
              <label htmlFor="webhook-url">Webhook URL</label>
              <input
                id="webhook-url"
                type="url"
                required
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://your-server.com/webhooks/3dify"
              />
            </div>
            {error && (
              <div className="note error" role="alert">
                {error}
                <button
                  type="button"
                  className="btn secondary small"
                  style={{ marginTop: 12 }}
                  onClick={() => setRevision((value) => value + 1)}
                >
                  Reload webhook
                </button>
              </div>
            )}
            <div className="row">
              <button className="btn" disabled={busy || !url.trim()}>
                {busy ? "Saving…" : "Save endpoint"}
                <ArrowRight size={16} />
              </button>
              {saved && (
                <button
                  type="button"
                  className="btn secondary"
                  disabled={busy}
                  onClick={remove}
                >
                  Remove webhook
                </button>
              )}
            </div>
            <small>
              {saved ? `Current endpoint: ${saved}` : "No webhook configured."}
            </small>
          </form>
        )}
      </section>
    </>
  );
}
export default function WebhooksPage() {
  return (
    <Workspace>
      <Webhooks />
    </Workspace>
  );
}
