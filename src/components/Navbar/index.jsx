const navItems = [
  ['dashboard', 'Dashboard'],
  ['register', 'Sample Register'],
  ['suppliers', 'Supplier Master'],
  ['password', 'Change Password'],
];

export default function Navbar({
  activePage,
  admin,
  isBackingUp,
  isRestoring,
  isDarkMode,
  onNavigate,
  onBackup,
  onRestore,
  onLogout,
  onToggleDarkMode,
}) {
  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <nav className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {navItems.map(([key, label]) => (
            <button
              key={key}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                activePage === key
                  ? 'bg-ink text-white shadow-sm ring-1 ring-ink/10 dark:bg-sky-400 dark:text-slate-950 dark:ring-sky-300'
                  : 'text-slate-600 hover:bg-white/70 hover:text-slate-950 dark:text-slate-100 dark:hover:bg-slate-700 dark:hover:text-white'
              }`}
              onClick={() => onNavigate(key)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Signed in as <strong className="text-slate-950 dark:text-white">{admin.username}</strong>
          </span>
          <button
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
            onClick={onBackup}
            disabled={isBackingUp || isRestoring}
          >
            {isBackingUp ? 'Backing Up...' : 'Backup'}
          </button>
          <button
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
            onClick={onRestore}
            disabled={isRestoring || isBackingUp}
          >
            {isRestoring ? 'Restoring...' : 'Restore'}
          </button>
          <button
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            onClick={onToggleDarkMode}
          >
            {isDarkMode ? 'Light' : 'Dark'}
          </button>
          <button
            className="rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-rose-400 dark:text-slate-950 dark:hover:bg-rose-300"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
