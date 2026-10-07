"use client";
import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Workspace, PageTitle } from "@/components/shell";
import { useAuth } from "@/lib/auth-context";
import { plansApi, Plan, errorMessage, formatPrice } from "@/lib/api";
import { toast } from "@/components/ui/toaster";
function Admin() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  const [deactivating, setDeactivating] = useState<Plan | null>(null);
  useEffect(() => {
    if (!user?.isAdmin) return;
    let alive = true;
    plansApi
      .listAll(user.token)
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
  }, [user, revision]);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || busy) return;
    const data = new FormData(event.currentTarget);
    const values = {
      displayName: String(data.get("displayName")).trim(),
      description: String(data.get("description")).trim(),
      priceCents: Number(data.get("priceCents")),
      rateLimitRpm: Number(data.get("rateLimitRpm")),
      monthlyQuota: Number(data.get("monthlyQuota")),
      sortOrder: Number(data.get("sortOrder")),
    };
    setBusy(true);
    setError("");
    try {
      if (editing) await plansApi.update(user.token, editing.id, values);
      else
        await plansApi.create(user.token, {
          ...values,
          name: String(data.get("name")).trim(),
          currency: String(data.get("currency")).toLowerCase(),
          stripePriceId: null,
        });
      setOpen(false);
      setRevision((value) => value + 1);
      toast({ title: editing ? "Plan updated" : "Plan created" });
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function deactivate() {
    if (!user || !deactivating || busy) return;
    setBusy(true);
    try {
      await plansApi.deactivate(user.token, deactivating.id);
      setDeactivating(null);
      setRevision((value) => value + 1);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        title="Plan administration"
        description="Manage the plans available to website users. Admin access is enforced by the backend."
        action={
          <button
            className="btn"
            onClick={() => {
              setEditing(null);
              setOpen(true);
              setError("");
            }}
          >
            Create plan <Plus size={16} />
          </button>
        }
      />
      {error && !open && (
        <div className="note error" role="alert" style={{ marginBottom: 24 }}>
          {error}
          <button
            className="btn secondary small"
            onClick={() => setRevision((value) => value + 1)}
          >
            Reload plans
          </button>
        </div>
      )}
      {loading ? (
        <p role="status">Loading plans…</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Plan</th>
                <th>Price / month</th>
                <th>Requests / minute</th>
                <th>Monthly quota</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id}>
                  <td>
                    <strong>{plan.displayName || plan.name}</strong>
                    <p className="muted">{plan.name}</p>
                  </td>
                  <td>{formatPrice(plan.priceCents, plan.currency)}</td>
                  <td>{plan.rateLimitRpm}</td>
                  <td>{plan.monthlyQuota.toLocaleString()}</td>
                  <td>
                    <span className="status">
                      {plan.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="row">
                      <button
                        className="btn secondary small"
                        onClick={() => {
                          setEditing(plan);
                          setOpen(true);
                          setError("");
                        }}
                      >
                        Edit
                      </button>
                      {plan.isActive && (
                        <button
                          className="btn secondary small"
                          onClick={() => setDeactivating(plan)}
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog.Root
        open={open}
        onOpenChange={(value) => {
          if (!busy) setOpen(value);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content">
            <div className="panel-head">
              <Dialog.Title asChild>
                <h2>{editing ? "Edit plan" : "Create plan"}</h2>
              </Dialog.Title>
              <Dialog.Close className="icon-btn" aria-label="Close">
                <X size={17} />
              </Dialog.Close>
            </div>
            <Dialog.Description className="muted">
              Changes update the backend’s website plan catalog.
            </Dialog.Description>
            <form onSubmit={save} className="stack">
              {!editing && (
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="plan-name">Internal name</label>
                    <input
                      id="plan-name"
                      name="name"
                      required
                      pattern="[a-z0-9-]+"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="currency">Currency</label>
                    <input
                      id="currency"
                      name="currency"
                      defaultValue="usd"
                      required
                      pattern="[A-Za-z]{3}"
                      maxLength={3}
                    />
                  </div>
                </div>
              )}
              <div className="field">
                <label htmlFor="display-name">Display name</label>
                <input
                  id="display-name"
                  name="displayName"
                  defaultValue={editing?.displayName || ""}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  defaultValue={editing?.description || ""}
                />
              </div>
              <div className="form-grid">
                {[
                  {
                    name: "priceCents",
                    label: "Monthly price in cents",
                    value: editing?.priceCents || 0,
                    min: 0,
                  },
                  {
                    name: "rateLimitRpm",
                    label: "API requests per minute",
                    value: editing?.rateLimitRpm || 10,
                    min: 1,
                  },
                  {
                    name: "monthlyQuota",
                    label: "Monthly job quota",
                    value: editing?.monthlyQuota || 100,
                    min: 0,
                  },
                  {
                    name: "sortOrder",
                    label: "Display order",
                    value: editing?.sortOrder || 0,
                    min: 0,
                  },
                ].map((field) => (
                  <div className="field" key={field.name}>
                    <label htmlFor={field.name}>{field.label}</label>
                    <input
                      id={field.name}
                      name={field.name}
                      type="number"
                      min={field.min}
                      step={1}
                      defaultValue={field.value}
                      required
                    />
                  </div>
                ))}
              </div>
              {error && (
                <div className="note error" role="alert">
                  {error}
                </div>
              )}
              <button className="btn" disabled={busy}>
                {busy ? "Saving…" : "Save plan"}
              </button>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root
        open={!!deactivating}
        onOpenChange={(value) => {
          if (!value && !busy) setDeactivating(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content">
            <Dialog.Title asChild>
              <h2>
                Deactivate {deactivating?.displayName || deactivating?.name}?
              </h2>
            </Dialog.Title>
            <Dialog.Description className="muted" style={{ marginTop: 14 }}>
              This plan will be removed from the public plan catalog.
            </Dialog.Description>
            <div className="row" style={{ marginTop: 24 }}>
              <button className="btn" disabled={busy} onClick={deactivate}>
                {busy ? "Deactivating…" : "Deactivate plan"}
              </button>
              <Dialog.Close className="btn secondary">Cancel</Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
export default function AdminPage() {
  return (
    <Workspace admin>
      <Admin />
    </Workspace>
  );
}
