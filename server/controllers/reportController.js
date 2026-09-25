/**
 * server/controllers/reportController.js
 * Executive Reporting Engine (Phase 6).
 * FRD §10
 */
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const Idea = require('../models/Idea');
const Benefit = require('../models/Benefit');
const DepartmentTarget = require('../models/DepartmentTarget');
const auditService = require('../services/auditService');
const { getHolidays, getElapsedBusinessDays } = require('../utils/businessDays');
const AppError = require('../utils/AppError');
const { IDEA_STATUS, TARGET_TYPE, AUDIT_ACTION } = require('../../shared/constants');

// Business-day SLA limits per review stage (FR-03-04).
const SLA_LIMITS = {
  [IDEA_STATUS.UNDER_SUPERVISOR_REVIEW]: 3,
  [IDEA_STATUS.UNDER_DEPARTMENT_EVALUATION]: 5,
  [IDEA_STATUS.UNDER_COMMITTEE_REVIEW]: 7,
};

// ---------------------------------------------------------------------------
// GET /api/reports/dashboard
// General summary metrics (Submissions by status, department, financial benefits)
// ---------------------------------------------------------------------------
exports.getDashboardReport = async (req, res, next) => {
  try {
    const totalIdeas = await Idea.countDocuments();
    
    // Status breakdown
    const statusBreakdown = await Idea.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Department breakdown
    const departmentBreakdown = await Idea.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Category breakdown
    const categoryBreakdown = await Idea.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Financial benefits total
    const benefitsTotal = await Benefit.aggregate([
      {
        $group: {
          _id: null,
          totalCostSavings: { $sum: '$financial.costSavingsINR' },
          totalRevenueIncrease: { $sum: '$financial.revenueIncreaseINR' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalIdeas,
        statusBreakdown: statusBreakdown.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
        departmentBreakdown,
        categoryBreakdown,
        financialSummary: benefitsTotal[0] || { totalCostSavings: 0, totalRevenueIncrease: 0 }
      }
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/reports/department-targets
// Compare department targets vs actual achievements (submitted / published ideas)
// ---------------------------------------------------------------------------
exports.getDepartmentTargetsReport = async (req, res, next) => {
  try {
    const { financialYear = 'FY2026-27' } = req.query;

    const targets = await DepartmentTarget.find({ financialYear }).lean();
    
    // Statuses that count as "approved" and "implemented" for target tracking.
    const APPROVED_STATUSES = [
      IDEA_STATUS.APPROVED_FOR_PUBLISHING,
      IDEA_STATUS.APPROVED_FOR_IMPLEMENTATION,
      IDEA_STATUS.PUBLISHED,
      IDEA_STATUS.IMPLEMENTATION_INITIATED,
      IDEA_STATUS.IMPLEMENTATION_IN_PROGRESS,
      IDEA_STATUS.IMPLEMENTATION_COMPLETED,
      IDEA_STATUS.BENEFITS_RECORDED,
      IDEA_STATUS.OUTCOME_MONITORED,
      IDEA_STATUS.CLOSED,
    ];
    const IMPLEMENTED_STATUSES = [
      IDEA_STATUS.IMPLEMENTATION_COMPLETED,
      IDEA_STATUS.BENEFITS_RECORDED,
      IDEA_STATUS.OUTCOME_MONITORED,
      IDEA_STATUS.CLOSED,
    ];

    // Actual counts per dept: submitted (any non-draft), approved, implemented.
    const actualSubmissions = await Idea.aggregate([
      { $match: { status: { $ne: IDEA_STATUS.DRAFT } } },
      {
        $group: {
          _id: '$department',
          totalSubmitted: { $sum: 1 },
          totalApproved: {
            $sum: { $cond: [{ $in: ['$status', APPROVED_STATUSES] }, 1, 0] },
          },
          totalImplemented: {
            $sum: { $cond: [{ $in: ['$status', IMPLEMENTED_STATUSES] }, 1, 0] },
          },
        },
      },
    ]);

    const actualMap = actualSubmissions.reduce((acc, item) => {
      acc[item._id] = item;
      return acc;
    }, {});

    const report = targets.map(t => {
      const actual = actualMap[t.department] || {
        totalSubmitted: 0,
        totalApproved: 0,
        totalImplemented: 0,
      };

      // Map achievement to the valid TARGET_TYPE (total_ideas / approved_ideas / implemented_ideas).
      let achieved;
      switch (t.targetType) {
        case TARGET_TYPE.APPROVED_IDEAS:
          achieved = actual.totalApproved;
          break;
        case TARGET_TYPE.IMPLEMENTED_IDEAS:
          achieved = actual.totalImplemented;
          break;
        case TARGET_TYPE.TOTAL_IDEAS:
        default:
          achieved = actual.totalSubmitted;
          break;
      }

      const pct =
        t.targetValue > 0
          ? Math.min(100, Number(((achieved / t.targetValue) * 100).toFixed(1)))
          : 0;

      return {
        department: t.department,
        targetType: t.targetType,
        targetValue: t.targetValue,
        achievedValue: achieved,
        achievementPct: pct
      };
    });

    res.status(200).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/reports/sla-performance
// SLA breach audit summary
// ---------------------------------------------------------------------------
exports.getSlaPerformanceReport = async (req, res, next) => {
  try {
    const holidays = await getHolidays();
    const now = new Date();

    // Ideas currently sitting in a review stage — compute live elapsed vs. limit.
    const pendingIdeas = await Idea.find({ status: { $in: Object.keys(SLA_LIMITS) } })
      .select('ideaId title status department statusHistory')
      .lean();

    const currentlyPending = [];
    let breachedCount = 0;

    for (const idea of pendingIdeas) {
      const entry = [...idea.statusHistory].reverse().find((h) => h.status === idea.status);
      if (!entry) continue;
      const elapsed = getElapsedBusinessDays(entry.timestamp, now, holidays);
      const limit = SLA_LIMITS[idea.status];
      const isBreached = elapsed > limit;
      if (isBreached) breachedCount += 1;

      currentlyPending.push({
        ideaId: idea.ideaId,
        title: idea.title,
        department: idea.department,
        stage: idea.status,
        elapsedBusinessDays: elapsed,
        slaLimit: limit,
        isBreached,
        enteredStageAt: entry.timestamp,
      });
    }

    // Sort worst-first (most overdue).
    currentlyPending.sort(
      (a, b) => b.elapsedBusinessDays - b.slaLimit - (a.elapsedBusinessDays - a.slaLimit)
    );

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalInReview: currentlyPending.length,
          totalBreached: breachedCount,
          onTrack: currentlyPending.length - breachedCount,
        },
        items: currentlyPending,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/reports/export?format=xlsx|csv|pdf
// Export an aggregate idea report. Restricted to admin/committee (route-level).
// Deliberately excludes PII (submitter email); shows department + ideaId only.
// ---------------------------------------------------------------------------
exports.exportReport = async (req, res, next) => {
  try {
    const format = (req.query.format || 'xlsx').toLowerCase();

    // Non-PII projection: no submitter email/name — department + ideaId is enough
    // for executive reporting and avoids leaking personal data.
    const ideas = await Idea.find()
      .select('ideaId title category department status createdAt publishedAt')
      .sort({ createdAt: -1 })
      .lean();

    const rows = ideas.map((i) => ({
      ideaId: i.ideaId || '',
      title: i.title || '',
      category: i.category || '',
      department: i.department || '',
      status: i.status || '',
      submittedOn: i.createdAt ? new Date(i.createdAt).toISOString().slice(0, 10) : '',
      publishedOn: i.publishedAt ? new Date(i.publishedAt).toISOString().slice(0, 10) : '',
    }));

    const columns = [
      { header: 'Idea ID', key: 'ideaId', width: 16 },
      { header: 'Title', key: 'title', width: 40 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Status', key: 'status', width: 24 },
      { header: 'Submitted On', key: 'submittedOn', width: 14 },
      { header: 'Published On', key: 'publishedOn', width: 14 },
    ];

    await auditService.log({
      actorId: req.user._id,
      action: AUDIT_ACTION.EXPORT,
      entityType: 'Report',
      entityId: `ideas_export_${format}`,
      metadata: { format, rowCount: rows.length },
      ipAddress: req.ip,
    });

    // ── CSV ──
    if (format === 'csv') {
      const escape = (v) => {
        const s = String(v ?? '');
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const header = columns.map((c) => escape(c.header)).join(',');
      const body = rows
        .map((r) => columns.map((c) => escape(r[c.key])).join(','))
        .join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="ideas-report.csv"');
      return res.status(200).send(`${header}\n${body}`);
    }

    // ── PDF ──
    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="ideas-report.pdf"');
      const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
      doc.pipe(res);
      doc.fontSize(18).text('IdeaHub — Ideas Report', { align: 'left' });
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor('#666')
        .text(`Generated ${new Date().toISOString().slice(0, 10)} · ${rows.length} ideas`);
      doc.moveDown();
      doc.fillColor('#000').fontSize(9);
      rows.forEach((r) => {
        doc.text(
          `${r.ideaId}  |  ${r.title}  |  ${r.department}  |  ${r.status}  |  ${r.submittedOn}`
        );
      });
      doc.end();
      return undefined;
    }

    // ── XLSX (default) ──
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Ideas');
    sheet.columns = columns;
    sheet.getRow(1).font = { bold: true };
    rows.forEach((r) => sheet.addRow(r));

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="ideas-report.xlsx"');
    await workbook.xlsx.write(res);
    return res.end();
  } catch (err) {
    next(err);
  }
};
