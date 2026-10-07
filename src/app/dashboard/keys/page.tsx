"use client";
import { useEffect, useState } from "react";
import { Copy, KeyRound, Plus, RefreshCw, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Workspace, PageTitle } from "@/components/shell";
import { useAuth } from "@/lib/auth-context";
import {
  apiKeysApi,
  subscriptionApi,
  ApiKey,
  errorMessage,
  formatDate,
} from "@/lib/api";
import { toast } from "@/components/ui/toaster";
function Keys() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState("");
  const [revision, setRevision] = useState(0);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    let alive = true;
    apiKeysApi
      .list(user.token)
      .then((keys) => {
        if (alive) {
          setKeys(keys);
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
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || busy) return;
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const subscription = await subscriptionApi.getStatus(user.token);
      const result = await apiKeysApi.create(
        user.token,
        String(data.get("label")).trim(),
        subscription.planName || "free",
      );
      setRaw(result.key);
      setRevision((value) => value + 1);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function revoke() {
    if (!user || !revokeId || busy) return;
    setBusy(true);
    try {
      await apiKeysApi.revoke(user.token, revokeId);
      try {
        const saved = JSON.parse(
          sessionStorage.getItem("3dify:website-key") || "null",
        );
        if (saved?.id === revokeId)
          sessionStorage.removeItem("3dify:website-key");
      } catch {}
      setRevokeId(null);
      setRevision((value) => value + 1);
      toast({ title: "API key revoked" });
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        title="API keys"
        description="Connect your own client to the generation API. Keys created by the website appear here too."
        action={
          <button
            className="btn"
            onClick={() => {
              setRaw("");
              setOpen(true);
            }}
          >
            Create key <Plus size={16} />
          </button>
        }
      />
      {error && (
        <div className="note error" role="alert">
          {error}
        </div>
      )}
      {loading ? (
        <p role="status">Loading keys…</p>
      ) : keys.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Label</th>
                <th>Prefix</th>
                <th>Plan</th>
                <th>Created</th>
                <th>Status</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id}>
                  <td>{key.label || "Untitled key"}</td>
                  <td>{key.keyPrefix}…</td>
                  <td>{key.planName}</td>
                  <td>{formatDate(key.createdAt)}</td>
                  <td>
                    <span className="status">
                      {key.isActive ? "Active" : "Revoked"}
                    </span>
                  </td>
                  <td>
                    {key.isActive && (
                      <button
                        className="btn secondary small"
                        onClick={() => setRevokeId(key.id)}
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">
          <KeyRound size={28} />
          <h2 style={{ marginTop: 18 }}>No API keys yet.</h2>
          <p style={{ marginTop: 12 }}>
            Generate on the website to create a session key, or create one for
            your integration.
          </p>
        </div>
      )}
      <Dialog.Root
        open={open}
        onOpenChange={(value) => {
          if (!busy) {
            setOpen(value);
            if (!value) setRaw("");
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content">
            <div className="panel-head">
              <Dialog.Title asChild>
                <h2>{raw ? "Save your API key" : "Create an API key"}</h2>
              </Dialog.Title>
              <Dialog.Close className="icon-btn" aria-label="Close">
                <X size={17} />
              </Dialog.Close>
            </div>
            <Dialog.Description className="muted">
              {raw
                ? "This key is shown once. Copy it before closing this window."
                : "The key will use your current subscription plan."}
            </Dialog.Description>
            {raw ? (
              <div className="stack" style={{ marginTop: 24 }}>
                <code className="code">{raw}</code>
                <button
                  className="btn"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(raw);
                      toast({ title: "Key copied" });
                    } catch {
                      toast({ title: "Select and copy the key manually" });
                    }
                  }}
                >
                  Copy key <Copy size={16} />
                </button>
              </div>
            ) : (
              <form onSubmit={create} className="stack">
                <div className="field">
                  <label htmlFor="key-label">Label</label>
                  <input
                    id="key-label"
                    name="label"
                    placeholder="e.g. Local integration"
                    maxLength={100}
                  />
                </div>
                {error && <p role="alert">{error}</p>}
                <button className="btn" disabled={busy}>
                  {busy ? "Creating…" : "Create key"}
                  <Plus size={16} />
                </button>
              </form>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root
        open={!!revokeId}
        onOpenChange={(value) => {
          if (!value && !busy) setRevokeId(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content">
            <Dialog.Title asChild>
              <h2>Revoke this key?</h2>
            </Dialog.Title>
            <Dialog.Description className="muted" style={{ marginTop: 12 }}>
              Requests using this key will stop working. Existing jobs remain in
              your history.
            </Dialog.Description>
            <div className="row" style={{ marginTop: 24 }}>
              <button className="btn" disabled={busy} onClick={revoke}>
                {busy ? "Revoking…" : "Revoke key"}
              </button>
              <Dialog.Close className="btn secondary">Cancel</Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
export default function KeysPage() {
  return (
    <Workspace>
      <Keys />
    </Workspace>
  );
}
