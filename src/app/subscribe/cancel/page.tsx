import Link from "next/link";
import { Header, PageTitle } from "@/components/shell";
export default function Cancel() {
  return (
    <>
      <Header />
      <main id="main-content" className="public-page">
        <PageTitle
          title="Checkout canceled."
          description="You can return to the plans page or continue in your workspace."
        />
        <div className="row">
          <Link href="/subscribe" className="btn">
            View plans
          </Link>
          <Link href="/dashboard" className="btn secondary">
            Open workspace
          </Link>
        </div>
      </main>
    </>
  );
}
