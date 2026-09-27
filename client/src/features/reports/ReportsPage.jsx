/**
 * ReportsPage — FRD §11 Executive Analytics & Reports.
 * KPI summary, department/category charts, target tracker, and
 * multi-format export (xlsx / csv / pdf) via authenticated blob download.
 */
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsAPI } from '../../api';
import { getFYLabel } from '@shared/constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, TrendingUp, IndianRupee, Target, PieChart as PieIcon } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Toast from '../../components/Toast';

// Theme-token categorical palette (adapts to light/dark; matches the navy/indigo brand).
const COLORS = ['var(--primary)', 'var(--info)', 'var(--purple)', 'var(--success)', 'var(--warning)', 'var(--text-muted)'];
const TARGET_TYPE_LABEL = {
  total_ideas: 'Total Ideas',
  approved_ideas: 'Approved Ideas',
  implemented_ideas: 'Implemented Ideas',
};

// Theme-token tooltip styling (correct in light and dark mode).
const TOOLTIP_STYLE = {
  backgroundColor: 'var(--surface)',
  borderColor: 'var(--border)',
  borderRadius: '12px',
  color: 'var(--text-primary)',
};

const EXPORT_FORMATS = [
  { key: 'xlsx', label: 'Excel', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ext: 'xlsx' },
  { key: 'csv',  label: 'CSV',   mime: 'text/csv', ext: 'csv' },
  { key: 'pdf',  label: 'PDF',   mime: 'application/pdf', ext: 'pdf' },
];

export default function ReportsPage() {
  usePageTitle("Executive Analytics");
  const [exporting, setExporting] = useState('');
  const [toast, setToast] = useState(null);

  // Auto-dismiss toasts so they do not linger.
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const { data: dashboardData, isLoading: dashLoading, isError: dashError, refetch: refetchDash } = useQuery({
    queryKey: ['reportDashboard'],
    queryFn: () => reportsAPI.getDashboard().then((r) => r.data.data),
  });

  const { data: targetData = [], isError: targetError, refetch: refetchTargets } = useQuery({
    queryKey: ['reportTargets'],
    queryFn: () => reportsAPI.getDepartmentTargets().then((r) => r.data.data),
  });

  const handleExport = async (fmt) => {
    setExporting(fmt.key);
    try {
      const res = await reportsAPI.exportData(fmt.key);
      const blob = new Blob([res.data], { type: fmt.mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ideahub_report_${new Date().toISOString().slice(0, 10)}.${fmt.ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setToast({ tone: 'error', message: 'Failed to export the report. Please try again.' });
    } finally {
      setExporting('');
    }
  };

  if (dashLoading) {
    return (
      <div className="page-enter max-w-[1400px] mx-auto pb-12 space-y-8" aria-busy="true" aria-label="Loading executive analytics">
        <div className="h-9 w-1/3 skeleton rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl skeleton" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/2 skeleton rounded" />
                <div className="h-7 w-1/3 skeleton rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-6">
              <div className="h-4 w-1/3 skeleton rounded mb-6" />
              <div className="h-56 w-full skeleton rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const deptData = dashboardData?.departmentBreakdown?.map((item) => ({ name: item._id, count: item.count })) || [];
  const catData = dashboardData?.categoryBreakdown?.map((item) => ({ name: item._id, value: item.count })) || [];
  const finSummary = dashboardData?.financialSummary || { totalCostSavings: 0, totalRevenueIncrease: 0 };

  return (
    <div className="page-enter max-w-[1400px] mx-auto pb-12">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-display text-3xl text-theme-text mb-2">Executive Analytics &amp; Reports</h1>
          <p className="text-theme-text/80">System-wide performance, department targets, and financial benefits breakdown.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Export report">
          <span className="text-xs font-semibold text-theme-text0 uppercase tracking-wider mr-1">Export</span>
          {EXPORT_FORMATS.map((fmt) => (
            <button
              key={fmt.key}
              onClick={() => handleExport(fmt)}
              disabled={!!exporting}
              className="btn btn-secondary btn-sm"
              aria-label={`Export report as ${fmt.label}`}
            >
              <Download className="w-4 h-4" aria-hidden="true" /> {exporting === fmt.key ? 'Exporting…' : fmt.label}
            </button>
          ))}
        </div>
      </div>

      {toast && (
        <div className="mb-6">
          <Toast tone={toast.tone} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}

      {dashError ? (
        <div className="glass rounded-2xl mb-8">
          <ErrorState
            title="Couldn't load reports"
            message="The analytics didn't load. Check your connection and try again."
            onRetry={() => refetchDash()}
          />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="glass rounded-2xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-theme-accent/10 border border-theme-accent/20 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 text-theme-accent" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold text-theme-text/80 uppercase tracking-wider">Total Submissions</p>
                <p className="text-3xl font-bold text-theme-text tabular-nums">{dashboardData?.totalIdeas || 0}</p>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success-light border border-success/30 flex items-center justify-center shrink-0">
                <IndianRupee className="w-6 h-6 text-success" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold text-theme-text/80 uppercase tracking-wider">Total Financial Benefits</p>
                <p className="text-3xl font-bold text-success-text tabular-nums">₹{(finSummary.totalCostSavings + finSummary.totalRevenueIncrease).toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-theme-accent/10 border border-theme-accent/20 flex items-center justify-center shrink-0">
                <Target className="w-6 h-6 text-theme-accent" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold text-theme-text/80 uppercase tracking-wider">Avg Target Performance</p>
                <p className="text-3xl font-bold text-theme-accent tabular-nums">
                  {targetData.length > 0 ? `${(targetData.reduce((s, t) => s + (t.achievementPct || 0), 0) / targetData.length).toFixed(1)}%` : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <section className="glass rounded-2xl p-6" aria-labelledby="chart-dept-heading">
              <h2 id="chart-dept-heading" className="text-lg font-bold text-theme-text mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-theme-accent" aria-hidden="true" /> Submissions by Department
              </h2>
              {deptData.length === 0 ? (
                <EmptyState title="No submission data" message="Department submissions will appear here once ideas are created." />
              ) : (
                <div className="h-72 w-full" role="img"
                  aria-label={`Bar chart of submissions by department for ${deptData.length} departments. Highest: ${deptData.reduce((a, b) => (b.count > a.count ? b : a)).name}.`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptData}>
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--primary-light)' }} />
                      <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="glass rounded-2xl p-6" aria-labelledby="chart-cat-heading">
              <h2 id="chart-cat-heading" className="text-lg font-bold text-theme-text mb-6 flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-theme-accent" aria-hidden="true" /> Submissions by Category
              </h2>
              {catData.length === 0 ? (
                <EmptyState title="No category data" message="Category breakdown appears once ideas carry a category." />
              ) : (
                <div className="h-72 w-full" role="img"
                  aria-label={`Pie chart of submissions by category: ${catData.map((c) => `${c.name} ${c.value}`).join(', ')}.`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                        {catData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          </div>
        </>
      )}

      {/* Department Targets Progress Table */}
      <section className="glass rounded-2xl p-6" aria-labelledby="targets-heading">
        <h2 id="targets-heading" className="text-lg font-bold text-theme-text mb-6 flex items-center gap-2">
          <Target className="w-5 h-5 text-theme-accent" aria-hidden="true" /> Department Target vs Achievement Tracker
        </h2>

        {targetError ? (
          <ErrorState title="Couldn't load department targets" message="The target tracker didn't load." onRetry={() => refetchTargets()} />
        ) : targetData.length === 0 ? (
          <p className="text-theme-text0 italic text-center py-8">No department targets configured yet for {getFYLabel()}.</p>
        ) : (
          <div className="table-responsive">
            <table className="table-base">
              <caption className="sr-only">Department targets versus achieved values for {getFYLabel()}</caption>
              <thead>
                <tr>
                  <th scope="col">Department</th>
                  <th scope="col">Target Type</th>
                  <th scope="col">Target Value</th>
                  <th scope="col">Achieved</th>
                  <th scope="col">Progress</th>
                </tr>
              </thead>
              <tbody>
                {targetData.map((row, idx) => (
                  <tr key={idx}>
                    <td className="font-semibold text-theme-text">{row.department}</td>
                    <td>{TARGET_TYPE_LABEL[row.targetType] || row.targetType}</td>
                    <td className="font-bold tabular-nums">{row.targetValue}</td>
                    <td className="font-bold text-success-text tabular-nums">{row.achievedValue}</td>
                    <td>
                      <div className="flex items-center gap-3 w-48" role="img" aria-label={`${row.achievementPct} percent of target`}>
                        <div className="flex-1 h-2 bg-theme-surface rounded-full overflow-hidden">
                          <div className="h-full gradient-brand rounded-full" style={{ width: `${Math.min(100, row.achievementPct || 0)}%` }} />
                        </div>
                        <span className="text-xs font-bold text-theme-text/80 tabular-nums">{row.achievementPct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
