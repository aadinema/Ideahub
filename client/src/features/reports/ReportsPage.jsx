/**
 * ReportsPage — FRD §11 Executive Analytics & Reports.
 * KPI summary, department/category charts, target tracker, and
 * multi-format export (xlsx / csv / pdf) via authenticated blob download.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsAPI } from '../../api';
import { getFYLabel } from '@shared/constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, TrendingUp, IndianRupee, Target, PieChart as PieIcon } from 'lucide-react';

// Warm palette to match the cream/gold theme.
const COLORS = ['#c5a059', '#b08a46', '#8c6a32', '#dfaa5b', '#eac585', '#737373'];
const TARGET_TYPE_LABEL = {
  total_ideas: 'Total Ideas',
  approved_ideas: 'Approved Ideas',
  implemented_ideas: 'Implemented Ideas',
};

// Light-theme tooltip styling reused across charts.
const TOOLTIP_STYLE = {
  backgroundColor: '#FDFBF7',
  borderColor: '#E2DDD5',
  borderRadius: '12px',
  color: '#1A1A1A',
};

const EXPORT_FORMATS = [
  { key: 'xlsx', label: 'Excel', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ext: 'xlsx' },
  { key: 'csv',  label: 'CSV',   mime: 'text/csv', ext: 'csv' },
  { key: 'pdf',  label: 'PDF',   mime: 'application/pdf', ext: 'pdf' },
];

export default function ReportsPage() {
  const [exporting, setExporting] = useState('');

  const { data: dashboardData, isLoading: dashLoading } = useQuery({
    queryKey: ['reportDashboard'],
    queryFn: () => reportsAPI.getDashboard().then((r) => r.data.data),
  });

  const { data: targetData = [] } = useQuery({
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
      alert('Failed to export report.');
    } finally {
      setExporting('');
    }
  };

  if (dashLoading) {
    return <div className="page-enter max-w-[1400px] mx-auto text-center py-20 text-theme-text/80">Loading Executive Analytics…</div>;
  }

  const deptData = dashboardData?.departmentBreakdown?.map((item) => ({ name: item._id, count: item.count })) || [];
  const catData = dashboardData?.categoryBreakdown?.map((item) => ({ name: item._id, value: item.count })) || [];
  const finSummary = dashboardData?.financialSummary || { totalCostSavings: 0, totalRevenueIncrease: 0 };

  return (
    <div className="page-enter max-w-[1400px] mx-auto pb-12">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-display text-4xl text-theme-text mb-2">Executive Analytics & Reports</h1>
          <p className="text-theme-text/80">System-wide performance, department targets, and financial benefits breakdown.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {EXPORT_FORMATS.map((fmt) => (
            <button
              key={fmt.key}
              onClick={() => handleExport(fmt)}
              disabled={!!exporting}
              className="btn btn-secondary btn-sm"
            >
              <Download className="w-4 h-4" /> {exporting === fmt.key ? 'Exporting…' : fmt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-theme-accent/10 border border-theme-accent/20 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-theme-accent" />
          </div>
          <div>
            <p className="text-xs font-semibold text-theme-text/80 uppercase tracking-wider">Total Submissions</p>
            <p className="text-3xl font-bold text-theme-text">{dashboardData?.totalIdeas || 0}</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <IndianRupee className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-theme-text/80 uppercase tracking-wider">Total Financial Benefits</p>
            <p className="text-3xl font-bold text-emerald-600">₹{(finSummary.totalCostSavings + finSummary.totalRevenueIncrease).toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-theme-accent/10 border border-theme-accent/20 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6 text-theme-accent" />
          </div>
          <div>
            <p className="text-xs font-semibold text-theme-text/80 uppercase tracking-wider">Avg Target Performance</p>
            <p className="text-3xl font-bold text-theme-accent">
              {targetData.length > 0 ? `${(targetData.reduce((s, t) => s + (t.achievementPct || 0), 0) / targetData.length).toFixed(1)}%` : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-bold text-theme-text mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-theme-accent" /> Submissions by Department
          </h3>
          <div className="h-72 w-full">
            {deptData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-theme-text0 italic">No submission data.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData}>
                  <XAxis dataKey="name" stroke="#737373" fontSize={12} />
                  <YAxis stroke="#737373" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(197,160,89,0.08)' }} />
                  <Bar dataKey="count" fill="#c5a059" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-bold text-theme-text mb-6 flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-theme-accent" /> Submissions by Category
          </h3>
          <div className="h-72 w-full flex items-center justify-center">
            {catData.length === 0 ? (
              <div className="text-sm text-theme-text0 italic">No category data.</div>
            ) : (
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
            )}
          </div>
        </div>
      </div>

      {/* Department Targets Progress Table */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-bold text-theme-text mb-6 flex items-center gap-2">
          <Target className="w-5 h-5 text-theme-accent" /> Department Target vs Achievement Tracker
        </h3>

        {targetData.length === 0 ? (
          <p className="text-theme-text/80 italic text-center py-8">No department targets configured yet for {getFYLabel()}.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-theme-text/80">
              <thead className="bg-theme-surface/50 text-xs font-semibold text-theme-text/80 uppercase tracking-wider">
                <tr>
                  <th className="p-4 rounded-l-xl">Department</th>
                  <th className="p-4">Target Type</th>
                  <th className="p-4">Target Value</th>
                  <th className="p-4">Achieved</th>
                  <th className="p-4 rounded-r-xl">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/50">
                {targetData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-theme-surface/30 transition-colors">
                    <td className="p-4 font-semibold text-theme-text">{row.department}</td>
                    <td className="p-4">{TARGET_TYPE_LABEL[row.targetType] || row.targetType}</td>
                    <td className="p-4 font-bold">{row.targetValue}</td>
                    <td className="p-4 font-bold text-emerald-600">{row.achievedValue}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3 w-48">
                        <div className="flex-1 h-2 bg-theme-surface rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-theme-accent to-emerald-500 rounded-full" style={{ width: `${Math.min(100, row.achievementPct || 0)}%` }} />
                        </div>
                        <span className="text-xs font-bold text-theme-text/80">{row.achievementPct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
