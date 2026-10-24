import Link from "next/link";
import { getOverview, getScorecard } from "@/app/lib/views";

export const dynamic = "force-dynamic";

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export default async function Home() {
  const overview = await getOverview();
  const scorecard = await getScorecard();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-10 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">
          The dispatch and accountability layer
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Every report becomes one problem, with one owner and one honest outcome.
        </p>
      </header>

      <section aria-labelledby="counter-heading">
        <h2 id="counter-heading" className="sr-only">
          Reports, problems, routed
        </h2>
        <p className="text-lg">
          <strong>{overview.totalReports.toLocaleString()}</strong> reports{" "}
          <span aria-hidden="true">→</span>{" "}
          <strong>{overview.totalProblems.toLocaleString()}</strong> problems{" "}
          <span aria-hidden="true">→</span>{" "}
          <strong>{overview.totalRouted.toLocaleString()}</strong> routed
        </p>
        {!overview.hasDatabase && (
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
            Running on in-memory fixtures (no DATABASE_URL). Seed Postgres for live counts.
          </p>
        )}
      </section>

      <section aria-labelledby="entities-heading" className="space-y-3">
        <h2 id="entities-heading" className="text-lg font-semibold">
          Entities
        </h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {overview.entities.map(({ entity, openCount }) => (
            <li key={entity.id}>
              <Link
                href={`/inbox/${entity.id}`}
                className="block h-full rounded-lg border border-neutral-300 p-4 hover:border-blue-500 hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                <span className="block font-medium">{entity.name}</span>
                <span className="mt-1 block text-sm text-neutral-600 dark:text-neutral-400">
                  {openCount} open · owns {entity.owns.join(", ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="scorecard-heading" className="space-y-3">
        <h2 id="scorecard-heading" className="text-lg font-semibold">
          Entity scorecard
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">
              Reroute rate and not-found share per entity
            </caption>
            <thead>
              <tr className="border-b border-neutral-300 text-left dark:border-neutral-700">
                <th scope="col" className="py-2 pr-4">Entity</th>
                <th scope="col" className="py-2 pr-4">Reroute rate</th>
                <th scope="col" className="py-2 pr-4">Not-found share</th>
              </tr>
            </thead>
            <tbody>
              {scorecard.map((row) => (
                <tr
                  key={row.entityId}
                  className="border-b border-neutral-200 dark:border-neutral-800"
                >
                  <th scope="row" className="py-2 pr-4 font-normal">
                    {row.name}
                  </th>
                  <td className="py-2 pr-4">{pct(row.rerouteRate)}</td>
                  <td className="py-2 pr-4">{pct(row.notFoundShare)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
