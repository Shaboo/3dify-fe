import Link from "next/link";
import { Header, Footer, PageTitle } from "@/components/shell";
export default function Docs() {
  return (
    <>
      <Header />
      <main
        id="main-content"
        className="public-page"
        style={{ maxWidth: 1150 }}
      >
        <PageTitle
          title="Build with 3dify."
          description="Submit photos, follow a task, and retrieve the generated model through the backend API."
        />
        <div className="stack">
          <section className="panel">
            <div className="step-title">
              <span className="section-number">01</span>
              <div>
                <h2>Get an API key</h2>
                <p>
                  Activate a website subscription, then create a key in your
                  workspace.
                </p>
              </div>
            </div>
            <Link href="/dashboard/keys" className="text-link">
              Manage API keys
            </Link>
            <p className="muted" style={{ marginTop: 16 }}>
              Send your key in the X-API-KEY header. Keep it on your server.
              Browser account routes use a Bearer token instead.
            </p>
          </section>
          <section className="panel">
            <div className="step-title">
              <span className="section-number">02</span>
              <div>
                <h2>Submit your photos</h2>
                <p>POST /api/v1/generate · multipart/form-data</p>
              </div>
            </div>
            <pre className="code">{`curl -X POST http://localhost:8080/api/v1/generate \\\n  -H "X-API-KEY: YOUR_API_KEY" \\\n  -F "images=@front.jpg" \\\n  -F "images=@back.jpg"`}</pre>
            <p className="muted" style={{ marginTop: 16 }}>
              Use repeated images parts for one or more photos. Photo limits
              depend on the configured provider. A successful submission returns
              HTTP 202 with jobId and status.
            </p>
            <pre
              className="code"
              style={{ marginTop: 16 }}
            >{`{ "jobId": "YOUR_JOB_ID", "status": "PENDING" }`}</pre>
          </section>
          <section className="panel">
            <div className="step-title">
              <span className="section-number">03</span>
              <div>
                <h2>Follow the task</h2>
                <p>GET /api/v1/jobs/YOUR_JOB_ID</p>
              </div>
            </div>
            <pre className="code">{`curl http://localhost:8080/api/v1/jobs/YOUR_JOB_ID \\\n  -H "X-API-KEY: YOUR_API_KEY"`}</pre>
            <p className="muted" style={{ marginTop: 16 }}>
              Poll within your plan’s request limit. Status moves from PENDING
              to PROCESSING, then SUCCESS or FAILED. Successful jobs expose
              outputGlbUrl and outputUsdzUrl when available. Failed jobs expose
              errorMessage.
            </p>
            <p className="muted" style={{ marginTop: 12 }}>
              If a submission response is lost, check GET /api/v1/jobs before
              submitting again. The generation endpoint does not currently
              guarantee duplicate prevention.
            </p>
          </section>
          <section className="panel">
            <h2>More endpoints</h2>
            <div className="table-wrap" style={{ marginTop: 16 }}>
              <table>
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Path</th>
                    <th>Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>GET</td>
                    <td>/api/v1/jobs</td>
                    <td>Jobs submitted using this key</td>
                  </tr>
                  <tr>
                    <td>GET</td>
                    <td>/api/v1/jobs/YOUR_JOB_ID/history</td>
                    <td>Status history</td>
                  </tr>
                  <tr>
                    <td>GET</td>
                    <td>/dashboard/generation-options</td>
                    <td>
                      Current provider’s photo limits; Bearer token required
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="muted" style={{ marginTop: 20 }}>
              Configure delivery of job updates in{" "}
              <Link href="/dashboard/webhooks" className="text-link">
                Webhooks
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
