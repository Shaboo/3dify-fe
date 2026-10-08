"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Maximize2, Minimize2 } from "lucide-react";
import Link from "next/link";

export function ContactStage() {
  const [detail, setDetail] = useState(false);
  return (
    <section className="contact-stage" aria-label="Illustrative object study">
      <div className={`contact-image ${detail ? "detail" : ""}`}>
        <Image
          src="/images/contact-chair.webp"
          alt="Illustrative chrome chair with lilac upholstery in a lavender studio"
          fill
          loading="eager"
          sizes="(max-width: 700px) 100vw, 90vw"
        />
        <div className="stage-caption">
          <span>Object study — Chrome / textile</span>
          <span>Illustrative artwork</span>
        </div>
        <button
          className="detail-toggle"
          aria-pressed={detail}
          onClick={() => setDetail(!detail)}
        >
          {detail ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          {detail ? "Full object" : "Inspect detail"}
        </button>
      </div>
      <div className="stage-rail">
        <div className="contact-inset" aria-hidden="true">
          <Image src="/images/contact-chair.webp" alt="" fill sizes="160px" />
          <span>Detail crop</span>
        </div>
        <div className="stage-instruction">
          <span className="stage-path">
            Photos <span>→</span> 3D model
          </span>
          <p>
            Start with an object.
            <br />
            Give it a new dimension.
          </p>
        </div>
        <Link href="/dashboard" className="stage-action">
          <span>
            Open the
            <br /> workspace
          </span>
          <ArrowUpRight size={36} strokeWidth={1.5} />
        </Link>
      </div>
    </section>
  );
}
