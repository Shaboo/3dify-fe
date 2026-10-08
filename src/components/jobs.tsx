"use client";
import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  Loader2,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import {
  jobsApi,
  Job,
  JobHistoryEntry,
  errorMessage,
  formatDate,
} from "@/lib/api";
export function Status({ status }: { status: string }) {
  return (
    <span
      className={`status ${status === "FAILED" ? "failed" : status === "SUCCESS" || status === "PROCESSING" ? "active" : ""}`}
    >
      {(status === "PENDING" || status === "PROCESSING") && (
        <Loader2 size={12} className="spin" />
      )}
      {{
        PENDING: "Queued",
        PROCESSING: "Generating",
        SUCCESS: "Ready",
        FAILED: "Failed",
      }[status] || status}
    </span>
  );
}
export function JobDetail({ job, token }: { job: Job; token: string }) {
  const [history, setHistory] = useState<JobHistoryEntry[]>([]);
  const [error, setError] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  useEffect(() => {
    setHistory([]);
    setShowHistory(false);
    setError("");
  }, [job.id]);
  useEffect(() => {
    if (!showHistory) return;
    let alive = true;
    setHistoryLoading(true);
    jobsApi
      .history(token, job.id)
      .then((value) => {
        if (alive) {
          setHistory(value);
          setError("");
        }
      })
      .catch((error) => {
        if (alive) setError(errorMessage(error));
      })
      .finally(() => {
        if (alive) setHistoryLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [showHistory, job.id, job.status, token]);
  return (
    <div className="job-detail">
      <div className="row">
        <Status status={job.status} />
        <small>{formatDate(job.createdAt)}</small>
      </div>
      <dl>
        <dt>Task ID</dt>
        <dd>{job.id}</dd>
        {job.completedAt && (
          <>
            <dt>Completed</dt>
            <dd>{formatDate(job.completedAt)}</dd>
          </>
        )}
      </dl>
      {job.status === "PROCESSING" || job.status === "PENDING" ? (
        <div className="note">
          <p>
            {job.status === "PENDING"
              ? "Your job is queued."
              : "The provider is generating your model."}{" "}
            This view checks for updates automatically.
          </p>
          <p className="muted">
            You can leave this page and find the job in your history.
          </p>
        </div>
      ) : null}
      {job.status === "FAILED" && (
        <div className="note error" role="alert">
          <h3>Generation failed</h3>
          <p>
            {job.errorMessage ||
              "The backend did not return an error description."}
          </p>
        </div>
      )}
      {job.status === "SUCCESS" && (
        <>
          <h3>Download your model</h3>
          <div className="row">
            {job.outputGlbUrl && (
              <a
                href={job.outputGlbUrl}
                className="btn"
                target="_blank"
                rel="noreferrer"
              >
                Download GLB <ArrowDownToLine size={17} />
              </a>
            )}
            {job.outputUsdzUrl && (
              <a
                href={job.outputUsdzUrl}
                className="btn secondary"
                target="_blank"
                rel="noreferrer"
              >
                Download USDZ <ArrowDownToLine size={17} />
              </a>
            )}
          </div>
          {!job.outputGlbUrl && !job.outputUsdzUrl && (
            <p className="muted">No output URLs were returned for this job.</p>
          )}
          <p className="muted">
            GLB works with web 3D viewers. USDZ is supported by Apple’s AR
            viewers.
          </p>
        </>
      )}
      <button
        className="btn secondary small"
        aria-expanded={showHistory}
        onClick={() => setShowHistory((value) => !value)}
      >
        {showHistory ? "Hide job history" : "View job history"}
        <ChevronRight size={15} />
      </button>
      {showHistory && (
        <div>
          {historyLoading ? (
            <p role="status">Loading history…</p>
          ) : (
            <ul className="history">
              {history.map((entry) => (
                <li key={entry.id}>
                  <div className="row">
                    <Status status={entry.status} />
                    <small>{formatDate(entry.createdAt)}</small>
                  </div>
                  {entry.details && <p>{entry.details}</p>}
                </li>
              ))}
            </ul>
          )}
          {!historyLoading && !history.length && !error && (
            <p className="muted">No history entries yet.</p>
          )}
          {error && <p role="alert">{error}</p>}
        </div>
      )}
    </div>
  );
}
export function JobList({
  jobs,
  selected,
  onSelect,
}: {
  jobs: Job[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="job-list">
      {jobs.map((job) => (
        <button
          key={job.id}
          className={`job-card ${selected === job.id ? "selected" : ""}`}
          onClick={() => onSelect(job.id)}
          aria-pressed={selected === job.id}
        >
          <div className="job-top">
            <Status status={job.status} />
            <small>{formatDate(job.createdAt)}</small>
          </div>
          <code>{job.id}</code>
        </button>
      ))}
    </div>
  );
}
export function useJobs(token?: string, awaitingJobId?: string | null) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!token) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    async function load() {
      let poll = true;
      try {
        const next = await jobsApi.list(token!);
        poll =
          next.some((job) => ["PENDING", "PROCESSING"].includes(job.status)) ||
          (!!awaitingJobId && !next.some((job) => job.id === awaitingJobId));
        if (alive) {
          setJobs(
            next.sort(
              (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
            ),
          );
          setError("");
        }
      } catch (error) {
        if (alive) setError(errorMessage(error));
      } finally {
        if (alive) {
          setLoading(false);
          if (poll) timer = setTimeout(load, 8000);
        }
      }
    }
    load();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [token, revision, awaitingJobId]);
  return {
    jobs,
    error,
    loading,
    refresh: () => setRevision((value) => value + 1),
  };
}
