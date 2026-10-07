import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Header, Footer } from "@/components/shell";
export default function Home() {
  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="hero-copy">
            <h1>
              Your photos.
              <br />
              <span className="blue">
                Another
                <br />
                dimension.
              </span>
            </h1>
            <p>
              Generate a 3D model from photos of an object. Follow its progress,
              then download it for the web or AR.
            </p>
            <Link className="btn" href="/dashboard">
              Open the workspace <ArrowUpRight size={20} />
            </Link>
            <small>Upload photos · Generate · Download</small>
          </div>
          <div
            className="hero-art"
            aria-label="Abstract wireframe cube illustration"
          >
            <span className="art-number" aria-hidden="true">
              3D
            </span>
            <div className="wire-cube" aria-hidden="true" />
            <p className="art-caption">
              An object, seen from more than one angle.
            </p>
          </div>
        </section>
        <section className="feature-grid">
          {[
            {
              n: "01",
              title: "Start with the object",
              text: "Upload clear photos from different angles. The workspace shows the photo limits for your selected generation provider.",
            },
            {
              n: "02",
              title: "Follow every job",
              text: "Keep your task ID, inspect its status, and see the backend’s error details if a generation fails.",
            },
            {
              n: "03",
              title: "Take the model with you",
              text: "Download available GLB and USDZ files. Use the API and webhooks when you’re ready to integrate.",
            },
          ].map((item) => (
            <div key={item.n}>
              <span className="section-number">{item.n}</span>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </div>
          ))}
        </section>
      </main>
      <Footer />
    </>
  );
}
