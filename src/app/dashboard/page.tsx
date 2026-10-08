"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Upload, X, ArrowRight, RefreshCw, Loader2, Check } from "lucide-react";
import { Workspace, PageTitle } from "@/components/shell";
import { JobDetail, JobList, useJobs } from "@/components/jobs";
import { useAuth } from "@/lib/auth-context";
import {
  generationApi,
  apiKeysApi,
  plansApi,
  subscriptionApi,
  ApiError,
  errorMessage,
  GenerationOptions,
  Plan,
  SubscriptionStatus,
} from "@/lib/api";
type Photo = { file: File; url: string; id: string };
const KEY = "3dify:website-key";
function Generate() {
  const { user } = useAuth();
  const token = user?.token;
  const {
    jobs,
    error: jobsError,
    loading: jobsLoading,
    refresh,
  } = useJobs(token);
  const [options, setOptions] = useState<GenerationOptions | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(
    null,
  );
  const [freePlan, setFreePlan] = useState<Plan | null>(null);
  const [setupError, setSetupError] = useState("");
  const [setupLoading, setSetupLoading] = useState(true);
  const [setupRevision, setSetupRevision] = useState(0);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const photoRef = useRef<Photo[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [activating, setActivating] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [unknown, setUnknown] = useState(false);
  const [checkedUnknown, setCheckedUnknown] = useState(false);
  const submissionLock = useRef(false);
  const pendingKey = `3dify:pending:${user?.userId}`;
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem(pendingKey);
      if (pending) {
        const saved = JSON.parse(pending);
        if (saved.jobId) {
          setSubmitted(saved.jobId);
          setSelected(saved.jobId);
        } else setUnknown(true);
      }
    } catch {}
  }, [pendingKey]);
  useEffect(() => {
    if (!token) return;
    let alive = true;
    setSetupLoading(true);
    setSetupError("");
    Promise.all([
      generationApi.options(token),
      subscriptionApi.getStatus(token),
      plansApi.listActive(),
    ])
      .then(([options, subscription, plans]) => {
        if (alive) {
          setOptions(options);
          setSubscription(subscription);
          setFreePlan(plans.find((plan) => plan.priceCents === 0) || null);
        }
      })
      .catch((error) => {
        if (alive) setSetupError(errorMessage(error));
      })
      .finally(() => {
        if (alive) setSetupLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [token, setupRevision]);
  useEffect(() => {
    photoRef.current = photos;
  }, [photos]);
  useEffect(
    () => () => {
      photoRef.current.forEach((photo) => URL.revokeObjectURL(photo.url));
    },
    [],
  );
  const activeJob = jobs.find((job) => job.id === submitted);
  const selectedJob = jobs.find((job) => job.id === selected);
  const inProgress =
    !!submitted &&
    (!activeJob || ["PENDING", "PROCESSING"].includes(activeJob.status));
  function addFiles(incoming: File[]) {
    if (busy || unknown || inProgress) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    const invalid = incoming.find(
      (file) => !allowed.includes(file.type) || file.size === 0,
    );
    if (invalid) {
      setError("Choose non-empty JPG, PNG, or WebP photos.");
      return;
    }
    const max = options?.maxImages;
    if (
      max !== null &&
      max !== undefined &&
      photos.length + incoming.length > max
    ) {
      setError(
        `The ${options?.provider} provider accepts at most ${max} photos. Remove a photo before adding more.`,
      );
      return;
    }
    setError("");
    setPhotos((previous) => [
      ...previous,
      ...incoming.map((file) => ({
        file,
        url: URL.createObjectURL(file),
        id: crypto.randomUUID(),
      })),
    ]);
  }
  function remove(id: string) {
    setPhotos((previous) => {
      const target = previous.find((photo) => photo.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return previous.filter((photo) => photo.id !== id);
    });
  }
  async function activate() {
    if (!user || !freePlan || activating) return;
    setActivating(true);
    setSetupError("");
    try {
      await subscriptionApi.createCheckout(
        user.token,
        freePlan.id,
        `${location.origin}/dashboard`,
        `${location.origin}/dashboard`,
      );
      setSubscription(await subscriptionApi.getStatus(user.token));
    } catch (error) {
      setSetupError(errorMessage(error));
    } finally {
      setActivating(false);
    }
  }
  async function submit() {
    if (
      !user ||
      !options ||
      !subscription?.isActive ||
      submissionLock.current ||
      unknown ||
      inProgress
    )
      return;
    if (
      photos.length < options.minImages ||
      (options.maxImages !== null && photos.length > options.maxImages)
    ) {
      setError("Choose the number of photos supported by this provider.");
      return;
    }
    submissionLock.current = true;
    setBusy(true);
    setError("");
    let sending = false;
    try {
      let key: string | undefined;
      try {
        const saved = JSON.parse(sessionStorage.getItem(KEY) || "null");
        if (saved?.userId === user.userId) key = saved.key;
      } catch {}
      if (!key) {
        const created = await apiKeysApi.create(
          user.token,
          "Website generation",
          subscription.planName || "free",
        );
        key = created.key;
        sessionStorage.setItem(
          KEY,
          JSON.stringify({ userId: user.userId, key, id: created.id }),
        );
      }
      sessionStorage.setItem(
        pendingKey,
        JSON.stringify({ startedAt: new Date().toISOString() }),
      );
      sending = true;
      const response = await generationApi.submit(
        key,
        photos.map((photo) => photo.file),
      );
      sessionStorage.setItem(
        pendingKey,
        JSON.stringify({ jobId: response.jobId }),
      );
      setSubmitted(response.jobId);
      setSelected(response.jobId);
      refresh();
    } catch (error) {
      const ambiguous =
        sending && (!(error instanceof ApiError) || error.status >= 500);
      if (ambiguous) {
        setUnknown(true);
        setCheckedUnknown(false);
        setError(
          `The submission response was lost. The backend may already have accepted the task. ${errorMessage(error)}`,
        );
      } else {
        sessionStorage.removeItem(pendingKey);
        setError(errorMessage(error));
        if (error instanceof ApiError && error.status === 401)
          sessionStorage.removeItem(KEY);
      }
    } finally {
      submissionLock.current = false;
      setBusy(false);
    }
  }
  function newGeneration() {
    photos.forEach((photo) => URL.revokeObjectURL(photo.url));
    setPhotos([]);
    setSubmitted(null);
    setError("");
    sessionStorage.removeItem(pendingKey);
  }
  async function checkHistory() {
    if (!user) return;
    setCheckedUnknown(false);
    try {
      await import("@/lib/api").then(({ jobsApi }) => jobsApi.list(user.token));
      refresh();
      setCheckedUnknown(true);
    } catch (error) {
      setError(errorMessage(error));
    }
  }
  return (
    <>
      <PageTitle
        title="Photos into 3D."
        description="Choose your photos, generate a model, and follow the task here."
        action={
          <Link href="/dashboard/jobs" className="text-link">
            All jobs
          </Link>
        }
      />
      {setupLoading ? (
        <div className="note" role="status">
          Connecting to the backend…
        </div>
      ) : setupError ? (
        <div className="note error" role="alert">
          <p>{setupError}</p>
          <button
            className="btn secondary small"
            style={{ marginTop: 12 }}
            onClick={() => setSetupRevision((value) => value + 1)}
          >
            Retry connection <RefreshCw size={14} />
          </button>
        </div>
      ) : !subscription?.isActive ? (
        <div className="panel" style={{ marginBottom: 28 }}>
          <div className="panel-head">
            <div>
              <h2>Activate your workspace</h2>
              <p className="muted" style={{ marginTop: 8 }}>
                {freePlan
                  ? "The free plan enables generation. No card or Shopify billing required."
                  : "Choose a plan to enable generation."}
              </p>
            </div>
          </div>
          {freePlan ? (
            <button className="btn" disabled={activating} onClick={activate}>
              {activating ? "Activating…" : "Activate free plan"}
              <ArrowRight size={18} />
            </button>
          ) : (
            <Link className="btn" href="/subscribe">
              Choose a plan <ArrowRight size={18} />
            </Link>
          )}
        </div>
      ) : (
        <div className="row" style={{ marginBottom: 28 }}>
          <span className="status active">
            <Check size={12} />
            {subscription.displayName || subscription.planName} active
          </span>
          {options && (
            <small>
              {options.provider} ·{" "}
              {options.maxImages === null
                ? `At least ${options.minImages} photo`
                : `${options.minImages}–${options.maxImages} photos per task`}
            </small>
          )}
        </div>
      )}
      <div className="split" style={{ marginTop: 28 }}>
        <section>
          <div className="step-title">
            <span className="section-number">01</span>
            <div>
              <h2>Choose your photos</h2>
              <p>Show the same object from different angles.</p>
            </div>
          </div>
          <label
            className={`upload ${dragging ? "dragging" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              addFiles(Array.from(event.dataTransfer.files));
            }}
          >
            <Upload size={28} className="blue" />
            <div>
              <h3>Drop photos here, or browse</h3>
              <p className="muted">
                JPG, PNG, WebP
                {options?.maxImages !== null && options?.maxImages !== undefined
                  ? ` · Up to ${options.maxImages} photos`
                  : ""}
              </p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                aria-label="Upload photos"
                disabled={busy || unknown || inProgress || !options}
                onChange={(event) => {
                  addFiles(Array.from(event.target.files || []));
                  event.target.value = "";
                }}
              />
            </div>
          </label>
          {photos.length > 0 ? (
            <div className="photo-grid">
              {photos.map((photo, index) => (
                <div className="photo" key={photo.id}>
                  <div className="photo-image">
                    <img
                      src={photo.url}
                      alt={`Selected photo ${index + 1}: ${photo.file.name}`}
                    />
                  </div>
                  <button
                    className="icon-btn"
                    disabled={busy || unknown || inProgress}
                    aria-label={`Remove ${photo.file.name}`}
                    onClick={() => remove(photo.id)}
                  >
                    <X size={14} />
                  </button>
                  <div className="photo-caption">
                    <span className="photo-num">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <span className="filename" title={photo.file.name}>
                        {photo.file.name}
                      </span>
                      <small>
                        {(photo.file.size / 1024 / 1024).toFixed(1)} MB
                      </small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted" style={{ margin: "20px 0 28px" }}>
              No photos selected yet.
            </p>
          )}
          <div className="step-title" style={{ marginTop: 32 }}>
            <span className="section-number">02</span>
            <div>
              <h2>Generate the model</h2>
              <p>The selected provider processes your photos.</p>
            </div>
          </div>
          {error && (
            <div
              className="note error"
              role="alert"
              style={{ marginBottom: 20 }}
            >
              {error}
            </div>
          )}
          {unknown ? (
            <div className="stack">
              <div className="note">
                <p>
                  Check job history for a new task before sending these photos
                  again.
                </p>
              </div>
              <button className="btn secondary" onClick={checkHistory}>
                Check job history <RefreshCw size={18} />
              </button>
              {checkedUnknown && (
                <>
                  <Link className="text-link" href="/dashboard/jobs">
                    Inspect the latest tasks
                  </Link>
                  <button
                    className="btn secondary"
                    onClick={() => {
                      sessionStorage.removeItem(pendingKey);
                      setUnknown(false);
                      setError("");
                    }}
                  >
                    I checked history; allow a new submission
                  </button>
                </>
              )}
            </div>
          ) : submitted && !inProgress ? (
            <button className="btn full" onClick={newGeneration}>
              Start a new generation <ArrowRight size={18} />
            </button>
          ) : (
            <button
              className="btn full"
              disabled={
                !photos.length ||
                !options ||
                !subscription?.isActive ||
                busy ||
                inProgress ||
                setupLoading
              }
              onClick={submit}
            >
              {busy
                ? "Uploading your photos…"
                : inProgress
                  ? "Generation in progress"
                  : "Generate 3D model"}
              {busy || inProgress ? (
                <Loader2 size={18} className="spin" />
              ) : (
                <ArrowRight size={18} />
              )}
            </button>
          )}
          <p className="muted" style={{ fontSize: 13, marginTop: 14 }}>
            Generation uses your provider account’s credits, including on the
            free website plan. Your original photos are uploaded without
            resizing.
          </p>
        </section>
        <section className="panel" style={{ alignSelf: "start" }}>
          <div className="panel-head">
            <div>
              <h2>Your tasks</h2>
              <p className="muted" style={{ marginTop: 7 }}>
                Live status from the backend.
              </p>
            </div>
            <button
              className="icon-btn"
              onClick={refresh}
              aria-label="Refresh jobs"
            >
              <RefreshCw size={17} />
            </button>
          </div>
          {jobsError && (
            <div
              className="note error"
              role="alert"
              style={{ marginBottom: 16 }}
            >
              {jobsError}
            </div>
          )}
          {submitted && !activeJob && (
            <div className="note" role="status">
              <p>Task accepted. Waiting for its first update.</p>
              <p style={{ overflowWrap: "anywhere" }}>{submitted}</p>
            </div>
          )}
          {jobsLoading ? (
            <p role="status">Loading tasks…</p>
          ) : !jobs.length && !submitted ? (
            <div className="empty">
              <h3>Your first model starts here.</h3>
              <p style={{ marginTop: 10 }}>
                Choose photos to start. Your task and downloads will appear
                here.
              </p>
            </div>
          ) : (
            <JobList
              jobs={jobs.slice(0, 4)}
              selected={selected}
              onSelect={setSelected}
            />
          )}{" "}
          {selectedJob && user && (
            <JobDetail job={selectedJob} token={user.token} />
          )}
        </section>
      </div>
    </>
  );
}
export default function GeneratePage() {
  return (
    <Workspace>
      <Generate />
    </Workspace>
  );
}
