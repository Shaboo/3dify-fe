"use client";
import { useState } from "react";
import Link from "next/link";
import { RefreshCw, ArrowRight } from "lucide-react";
import { Workspace, PageTitle } from "@/components/shell";
import { JobList, JobDetail, useJobs } from "@/components/jobs";
import { useAuth } from "@/lib/auth-context";
function History() {
  const { user } = useAuth();
  const { jobs, error, loading, refresh } = useJobs(user?.token);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState("ALL");
  const visible = jobs.filter(
    (job) => filter === "ALL" || job.status === filter,
  );
  const selectedJob = jobs.find((job) => job.id === selected);
  return (
    <>
      <PageTitle
        title="Job history"
        description="Every task submitted by your account, with its status and available files."
        action={
          <Link className="btn" href="/dashboard">
            New generation <ArrowRight size={16} />
          </Link>
        }
      />
      <div className="row" style={{ marginBottom: 24 }}>
        <div className="field">
          <label htmlFor="job-filter">Status</label>
          <select
            id="job-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            {[
              ["ALL", "All jobs"],
              ["PENDING", "Queued"],
              ["PROCESSING", "Generating"],
              ["SUCCESS", "Ready"],
              ["FAILED", "Failed"],
            ].map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <button className="btn secondary small" onClick={refresh}>
          Refresh <RefreshCw size={15} />
        </button>
      </div>
      {error && (
        <div className="note error" role="alert">
          {error}
        </div>
      )}
      {loading ? (
        <p role="status">Loading jobs…</p>
      ) : visible.length ? (
        <div className="split">
          <JobList jobs={visible} selected={selected} onSelect={setSelected} />
          <section className="panel">
            {selectedJob && user ? (
              <>
                <h2>Task details</h2>
                <JobDetail job={selectedJob} token={user.token} />
              </>
            ) : (
              <p className="muted">
                Select a job to view its details and downloads.
              </p>
            )}
          </section>
        </div>
      ) : (
        <div className="empty">
          <h2>{jobs.length ? "No jobs with this status." : "No jobs yet."}</h2>
          <p style={{ marginTop: 12 }}>
            Generate a model to see its progress here.
          </p>
        </div>
      )}
    </>
  );
}
export default function JobsPage() {
  return (
    <Workspace>
      <History />
    </Workspace>
  );
}
