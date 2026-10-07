import { Header, Footer, PageTitle } from "@/components/shell";
import { Plans } from "@/components/plans";
export default function Subscribe() {
  return (
    <>
      <Header />
      <main className="public-page">
        <PageTitle
          title="A plan for your work."
          description="Start with the free plan. Plan details below come directly from the backend."
        />
        <Plans />
      </main>
      <Footer />
    </>
  );
}
