import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSamples, getSampleStats } from '../../services/sampleApi';
import { getSuppliers } from '../../services/supplierApi';

function Icon({ type, className = 'h-5 w-5' }) {
  const common = {
    className,
    fill: 'none',
    viewBox: '0 0 24 24',
    strokeWidth: 1.8,
    stroke: 'currentColor',
  };

  if (type === 'warning') {
    return (
      <svg {...common}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
        />
      </svg>
    );
  }

  if (type === 'success') {
    return (
      <svg {...common}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75 11.25 15 15.75 9M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
    );
  }

  if (type === 'users') {
    return (
      <svg {...common}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 19.13a7.5 7.5 0 0 0-6 0M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 8.25a5.25 5.25 0 0 0-7.5-4.75M3 19.25a5.25 5.25 0 0 1 7.5-4.75"
        />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2.25 5H6.75A2.25 2.25 0 0 1 4.5 18.75V5.25A2.25 2.25 0 0 1 6.75 3h6.88c.6 0 1.17.24 1.59.66l3.12 3.12c.42.42.66.99.66 1.59v10.38A2.25 2.25 0 0 1 16.75 21Z"
      />
    </svg>
  );
}

function StatCard({ label, value, tone = 'neutral', icon, helper }) {
  const toneClass = {
    neutral:
      'bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-800/70 dark:text-slate-200 dark:ring-slate-700',
    warning:
      'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800',
    success:
      'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800',
    info: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-800',
  }[tone];

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <strong className="mt-2 block text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            {value ?? 0}
          </strong>
        </div>
        <div className={`rounded-xl p-2.5 ring-1 ${toneClass}`}>
          <Icon type={icon} />
        </div>
      </div>
      {helper && (
        <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">{helper}</p>
      )}
    </article>
  );
}

function StatusBadge({ status }) {
  const classes = {
    Pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/80 dark:text-amber-100',
    Tested: 'bg-sky-100 text-sky-800 dark:bg-sky-900/80 dark:text-sky-100',
    Reported: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-100',
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        classes[status] || classes.Pending
      }`}
    >
      {status || 'Pending'}
    </span>
  );
}

/**
 * onNavigate signature used throughout this component:
 *   onNavigate(page, registerView?, sampleId?)
 *
 * Fix #13: Previously every "View" click called onNavigate('register') with no
 * sample ID, so the user always landed on the sample list with nothing selected.
 * Now each row passes the sample's _id as the third argument, which App.js
 * forwards to SampleRegister as initialSampleId so the correct record is opened.
 */
export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState({ total: 0, Pending: 0, Tested: 0, Reported: 0 });
  const [recentSamples, setRecentSamples] = useState([]);
  const [supplierCount, setSupplierCount] = useState(0);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const [summary, latest, suppliers] = await Promise.all([
        getSampleStats(),
        getSamples({ page: 1, limit: 8 }),
        getSuppliers(),
      ]);
      setStats(summary);
      setRecentSamples(latest.samples || []);
      setSupplierCount(suppliers.length);
    } catch {
      setRecentSamples([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const attentionCount = Number(stats.Pending || 0) + Number(stats.Tested || 0);

  const filteredSamples = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return recentSamples;
    return recentSamples.filter((sample) =>
      [
        sample.reportNumber,
        sample.sampleNo,
        sample.supplierName,
        sample.sampleReference,
        sample.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [recentSamples, search]);

  /**
   * Determine the best view to open for a sample based on its status.
   * Pending → open test entry; Tested → open report; Reported → open report.
   */
  function viewForStatus(status) {
    if (status === 'Pending') return 'tests';
    return 'report';
  }

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-400">
              Lab operations
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              Today&apos;s workbench
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
              Track incoming samples, pending result entry, report-ready work, and supplier coverage
              from one focused dashboard.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="inline-flex items-center rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white shadow-sm ring-1 ring-ink/10 transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300 dark:bg-sky-400 dark:text-slate-950 dark:ring-sky-300 dark:hover:bg-sky-300"
              onClick={() => onNavigate('register', 'entry')}
            >
              + New Sample
            </button>
            <button
              className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              onClick={() => onNavigate('suppliers')}
            >
              Supplier Master
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total samples"
          value={stats.total}
          icon="document"
          helper="All registered samples"
        />
        <StatCard
          label="Need attention"
          value={attentionCount}
          tone="warning"
          icon="warning"
          helper="Pending or ready to report"
        />
        <StatCard
          label="Reports sent"
          value={stats.Reported}
          tone="success"
          icon="success"
          helper="Marked as reported"
        />
        <StatCard
          label="Suppliers"
          value={supplierCount}
          tone="info"
          icon="users"
          helper="Saved supplier records"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.4fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">Workflow</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {isLoading ? 'Refreshing...' : `${stats.total || 0} records tracked`}
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {[
              ['Pending', stats.Pending, 'Pending test entry', 'bg-amber-500'],
              ['Tested', stats.Tested, 'Reports ready to send', 'bg-sky-500'],
              ['Reported', stats.Reported, 'Completed samples', 'bg-emerald-500'],
            ].map(([key, value, label, dot]) => (
              <button
                key={key}
                className="flex w-full items-center gap-4 rounded-xl bg-slate-50 p-4 text-left transition hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800"
                onClick={() => onNavigate('register')}
              >
                <span className={`h-3 w-3 rounded-full ${dot}`} />
                <strong className="w-12 text-2xl font-bold text-slate-950 dark:text-white">
                  {value || 0}
                </strong>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">Recent samples</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Click a row to open it in the register.
              </p>
            </div>
            <div className="relative">
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pl-9 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-ink focus:bg-white focus:ring-4 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-sky-400 dark:focus:ring-sky-950 sm:w-64"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search samples"
              />
              <span className="pointer-events-none absolute left-3 top-2.5 text-slate-400">⌕</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800/80 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">Report</th>
                  <th className="px-5 py-3">Supplier</th>
                  <th className="px-5 py-3">Sample type</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSamples.length === 0 ? (
                  <tr>
                    <td
                      className="px-5 py-8 text-center text-slate-500 dark:text-slate-400"
                      colSpan="5"
                    >
                      No recent samples found.
                    </td>
                  </tr>
                ) : (
                  filteredSamples.map((sample) => (
                    <tr
                      key={sample._id}
                      className="cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-800/70"
                      onClick={() =>
                        onNavigate('register', viewForStatus(sample.status), sample._id)
                      }
                    >
                      <td className="px-5 py-4 font-semibold text-slate-950 dark:text-white">
                        {sample.reportNumber || sample.sampleNo || 'New sample'}
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                        {sample.supplierName}
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                        {sample.sampleReference}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={sample.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          className="rounded-lg px-3 py-1.5 text-xs font-bold text-ink transition hover:bg-slate-100 dark:text-sky-300 dark:hover:bg-slate-800"
                          onClick={(event) => {
                            event.stopPropagation();
                            onNavigate('register', viewForStatus(sample.status), sample._id);
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
}
