import Link from "next/link";
import { getRepo } from "@/db/getRepo";
import { Card } from "@/components/ui";
import { num, pct } from "@/components/format";

export const dynamic = "force-dynamic";

// The home page: what we built, and the three ways to look at it.
export default async function Home() {
  const ov = await getRepo().overview();

  return (
    <div className="space-y-8">
      <section className="max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-wider text-accent">Hackachusetts 2026 · Civic Action</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Every report becomes one problem, with one owner and one honest outcome.
        </h1>
        <p className="mt-3 text-base text-muted">
          We didn&apos;t build another 311 app. We built the layer 311 is missing: the backend that sits between
          intake and the crews. It clusters raw reports into problems, routes each one to its real owner with a reason,
          and replaces the free-text &ldquo;Noted&rdquo; closure with nine structured outcomes that residents can
          understand in their own language. Any front door can feed it: the 311 app, a phone call, or a resident&apos;s agent.
        </p>
        <p className="mt-3 text-base">
          Running right now on <strong>{num(ov.totalReports)}</strong> real Boston 311 reports from the last 30 days,
          collapsed into <strong>{num(ov.totalProblems)}</strong> problems.{" "}
          {pct(ov.cityNotedShare)} of the city&apos;s own closure notes start with &ldquo;Noted&rdquo;.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">One ledger, three views</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <ViewCard
            href="/ledger"
            n="1"
            title="Ledger"
            who="311 operations, the steward"
            body="The whole picture: the firehose collapsing into problems, who owns what, the scorecard, and every rule the router has learned."
          />
          <ViewCard
            href="/inbox/dcr"
            n="2"
            title="Entity"
            who="A department, agency or utility crew lead"
            body="A ranked inbox of work packets with a “why #1”, photos, map, checklist and history. One tap to record what happened. NOT_OURS reroutes and teaches the router."
          />
          <ViewCard
            href="/resident"
            n="3"
            title="Resident"
            who="The person who reported it"
            body="What reporting could feel like with an agent instead of a form, and what comes back: a plain-language outcome in their language instead of “Noted”."
          />
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold">How to walk through it</h2>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-muted">
            <li>Open <Link className="text-accent underline" href="/ledger">Ledger</Link>: 20,720 reports → problems → owners.</li>
            <li>Open the <Link className="text-accent underline" href="/inbox/dcr">DCR inbox</Link>. Packets are ranked with a reason: “DCR parkway segment, per the MassDOT Road Inventory”.</li>
            <li>On the West Roxbury Pkwy pothole, record <strong>Not ours → MassDOT</strong>. It reroutes and learns a rule.</li>
            <li>Click <strong>Replay next report</strong>. The next real report on that segment lands at MassDOT as a learned rule.</li>
            <li>In <Link className="text-accent underline" href="/inbox/parks-forestry?lang=other">Parks</Link>, record <strong>Fixed</strong> on the Hudson St packet. The reporter wrote in Chinese; so does the reply.</li>
            <li>Open <Link className="text-accent underline" href="/resident">Resident</Link> to see the intake side and every message a resident can get back.</li>
          </ol>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">What is actually here</h2>
          <ul className="mt-2 space-y-1.5 text-muted">
            <li><strong className="text-ink">Clustering:</strong> same type, within 25 m or on the same road segment, within 14 days. Order-independent and idempotent (property-tested).</li>
            <li><strong className="text-ink">Routing:</strong> learned rule → road jurisdiction (MassDOT Road Inventory) → service type → triage. The road&apos;s agency only gets it if they handle that issue type.</li>
            <li><strong className="text-ink">Priority:</strong> hazard × people × overdue, every factor on the card.</li>
            <li><strong className="text-ink">Outcome protocol:</strong> nine codes, each with an automatic next step and a resident message in English, Spanish, Haitian Creole and Chinese.</li>
            <li><strong className="text-ink">Memory:</strong> every hop is recorded, and every NOT_OURS becomes a routing rule.</li>
            <li><strong className="text-ink">Honesty:</strong> ETAs come from each queue&apos;s real 2024 workload, not the city&apos;s on-time flag.</li>
          </ul>
        </Card>
      </section>
    </div>
  );
}

function ViewCard({ href, n, title, who, body }: { href: string; n: string; title: string; who: string; body: string }) {
  return (
    <Link href={href} className="block rounded-lg border border-line bg-surface p-5 hover:border-accent focus-visible:ring-2 focus-visible:ring-accent">
      <p className="text-xs font-medium uppercase tracking-wider text-accent">View {n}</p>
      <h3 className="mt-1 text-xl font-semibold">{title}</h3>
      <p className="text-xs text-muted">{who}</p>
      <p className="mt-2 text-muted">{body}</p>
      <p className="mt-3 font-medium text-accent">Open →</p>
    </Link>
  );
}
