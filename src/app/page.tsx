import Link from "next/link";
import { ArrowRight, ArrowUpRight, Box, Code2, Download } from "lucide-react";
import { Header, Footer } from "@/components/shell";
import { ContactStage } from "@/components/contact-stage";

export default function Home() {
  return (
    <>
      <Header />
      <main id="main-content" className="home">
        <section className="home-intro">
          <h1>
            Your photos.
            <br />
            <span>Another dimension.</span>
          </h1>
          <p>
            Turn photos of an object into a 3D model. Follow the generation,
            then take it to the web or AR.
          </p>
        </section>
        <ContactStage />
        <section className="process-section">
          <div className="process-heading">
            <h2>
              A new perspective.
              <br />
              Three simple steps.
            </h2>
            <p>
              From the first photo to the final file.
              <br />
              Everything in one workspace.
            </p>
          </div>
          <ol className="process-list">
            <li>
              <span className="process-index">1</span>
              <div>
                <h3>Capture the object</h3>
                <p>
                  Choose clear photos from different angles. Your workspace
                  shows the photo limits for the selected provider.
                </p>
              </div>
              <Box size={24} strokeWidth={1.5} />
            </li>
            <li>
              <span className="process-index">2</span>
              <div>
                <h3>Follow the generation</h3>
                <p>
                  Submit your photos and track the task. See real status updates
                  and backend error details along the way.
                </p>
              </div>
              <ArrowRight size={24} strokeWidth={1.5} />
            </li>
            <li>
              <span className="process-index">3</span>
              <div>
                <h3>Take it into your world</h3>
                <p>
                  Download available GLB and USDZ files for your next web or AR
                  project.
                </p>
              </div>
              <Download size={24} strokeWidth={1.5} />
            </li>
          </ol>
        </section>
        <section className="integration-section">
          <div>
            <Code2 size={32} strokeWidth={1.5} />
            <h2>
              Part of your
              <br />
              next big build.
            </h2>
            <p>
              Bring photo-to-3D into your workflow with API keys, task
              endpoints, and webhooks.
            </p>
            <Link href="/docs" className="integration-link">
              Explore the API <ArrowUpRight size={20} />
            </Link>
          </div>
          <div className="api-study">
            <div className="api-study-head">
              <span>One object. More possibilities.</span>
              <span>API</span>
            </div>
            <pre>{`POST /api/v1/generate\nX-API-KEY: YOUR_API_KEY\n\nimages: front.jpg\nimages: back.jpg`}</pre>
            <div className="api-study-foot">
              <span>Upload → Track → Download</span>
              <ArrowRight size={20} />
            </div>
          </div>
        </section>
        <section className="home-close">
          <h2>
            What will you
            <br />
            make dimensional?
          </h2>
          <Link href="/dashboard" className="btn">
            Open the workspace <ArrowUpRight size={20} />
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
