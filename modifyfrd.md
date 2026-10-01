# IdeaHub Enterprise — Functional Requirement Document

**MPOnline Limited | CONFIDENTIAL**

**Project Name**: IdeaHub — Enterprise Innovation Management Platform
**Module**: Ideation → Evaluation → Decision → Execution → Business Impact
**Document Type**: Functional Requirement Document (FRD)
**Version**: 2.0
**Status**: DRAFT PENDING REVIEW
**Date**: 01 October 2026
**Relationship to v1.0**: This document is a **new, standalone FRD**. It does not amend,
replace, or supersede `IdeaHub_Ideathon_FRD.md` (v1.0). Where the two documents overlap,
**v1.0 remains the governing specification until this document is baselined**. See
§2.4 Relationship to FRD v1.0.

---

## Document Control

### Document Information

| Attribute | Details |
| :--- | :--- |
| Project Name | IdeaHub — Enterprise Innovation Management Platform |
| Document Type | Functional Requirement Document (FRD) |
| Version | 2.0 |
| Supersedes | Nothing. Coexists with `IdeaHub_Ideathon_FRD.md` v1.0 |
| Status | Draft |
| Classification | CONFIDENTIAL — INTERNAL USE ONLY |
| Target Stakeholders | Employees, Supervisors, Dept. Innovation Teams, Innovation Committee, Implementation Owners, Management, IT |

### Revision History

| Version | Date | Author | Description of Change | Status |
| :--- | :--- | :--- | :--- | :--- |
| 1.0 | 09 Jun 2026 | Nilesh Wadbude | Initial draft — Ideation & Improvement platform | Baselined |
| 2.0 | 01 Oct 2026 | IdeaHub Product Team | Enterprise expansion: full lifecycle to business impact, AI layer, ROI & impact measurement, integrations, enterprise security | Draft |

### Approvals

| Role | Name | Signature | Date |
| :--- | :--- | :--- | :--- |
| Subject Matter Expert | | | |
| IT Project Manager / CTO | | | |
| Solution Architect | | | |
| Finance / FP&A (ROI model sign-off) | | | |
| QA Lead | | | |

---

## Table of Contents

1. Executive Summary
2. Scope, Positioning & Relationship to v1.0
3. Business Vision & Objectives
4. Platform Concept: The Shift from Idea Collection to Value Management
5. System Overview & Capability Map
6. User Roles & Access Responsibilities
7. Idea Lifecycle 2.0
8. Detailed Functional Requirements — Core Platform
9. Detailed Functional Requirements — AI & Intelligence Layer
10. Detailed Functional Requirements — Business Impact & Value
11. Detailed Functional Requirements — Analytics & Executive Reporting
12. Detailed Functional Requirements — Governance, Security & Audit
13. Detailed Functional Requirements — Platform & Ecosystem
14. Delivery Roadmap (Phase 1–4)
15. Non-Functional Requirements
16. Assumptions, Dependencies & Constraints
17. Open Questions Requiring Stakeholder Decision
18. Glossary of Terms

---

## 1. Executive Summary

### 1.1 Purpose

IdeaHub has successfully delivered an idea management platform: employees submit ideas,
supervisors validate them, department innovation teams evaluate them, an innovation committee
approves them, implementation owners execute them, and benefits are recorded in a public
innovation gallery.

That capability is necessary but not sufficient for enterprise-wide deployment. The defining
characteristic of enterprise innovation platforms — as established by IdeaScale, Planview
Innovation Management, Brightidea, and ServiceNow Innovation Management — is that they manage
the **complete journey from idea to measurable value**, not merely the collection and approval
of ideas. They compete on lifecycle completeness, analytics depth, AI-assisted evaluation,
integration with delivery tooling, and demonstrated business outcomes.

This FRD defines the requirements to evolve IdeaHub from an **idea management system** into an
**enterprise innovation management platform**.

### 1.2 The Core Positioning Change

| | Current IdeaHub (v1.0) | IdeaHub Enterprise (v2.0) |
| :--- | :--- | :--- |
| **Purpose** | Collect, evaluate and approve ideas | Manage innovation from discovery to realised business value |
| **Terminal state** | Approved → Gallery | Impact measured → ROI reported → Portfolio managed |
| **Core question answered** | "What ideas exist and what was approved?" | "What value did our innovation programme create, and how do we do more of it?" |
| **Success metric** | Number of ideas submitted | Realised value, implementation rate, ROI, participation depth |
| **Lifecycle** | Idea → Review → Evaluation → Committee → Vote → Implementation | Idea → AI Discovery → Evaluation → Business Case → Decision → Pilot → Implementation → Impact → ROI → Portfolio |
| **Analytics** | Activity counts and status distribution | Funnel conversion, time-in-stage, ROI, portfolio balance, trend intelligence |
| **Integration** | Standalone | SSO/HRMS, Azure DevOps, Jira, BI, webhooks, APIs |

### 1.3 What This Document Covers

Twenty-five capability areas are specified in this document, grouped into:

- **Core platform** (lifecycle 2.0, SLA and bottleneck monitoring, audit timeline, advanced
  search, attachments, cross-department collaboration, smart notifications, implementation
  workspace, pilot stage, recognition)
- **AI & intelligence** (AI idea assistant, duplicate detection, AI categorisation, AI trend
  analysis, AI executive insights)
- **Business impact** (ROI calculator, business case, innovation portfolio, impact
  measurement, strategic alignment)
- **Analytics** (executive dashboard, innovation heatmap, trend intelligence)
- **Governance & security** (RBAC, Entra ID/SSO, SCIM, full audit)
- **Platform & ecosystem** (integrations, API and webhooks, mobile/PWA, multi-department
  tenancy, enterprise security, SLA governance)

### 1.4 Out of Scope for the Current Release

Consistent with v1.0 §1.2 and to avoid scope creep, the following remain **explicitly out of
scope** and are addressed only in their assigned roadmap phase (§14):

- Native iOS/Android applications (Phase 4 — web/PWA only before then)
- Real-time social collaboration feed
- Automated financial verification of benefit claims against ERP general ledger
- Any AI capability in Phase 1

---

## 2. Scope, Positioning & Relationship to v1.0

### 2.1 In Scope

This document specifies requirements for: the full idea lifecycle including AI pre-screening,
duplicate detection, business case, pilot and impact measurement; AI-assisted ideation and
analysis; business impact, ROI and portfolio management; executive analytics; workflow SLA and
bottleneck governance; enterprise authentication and authorization; audit and compliance;
integrations with delivery and BI tooling; API and webhook extensibility; mobile/PWA; and
multi-department organisational structure.

### 2.2 Out of Scope

| Item | Rationale |
| :--- | :--- |
| Native iOS / Android apps | Web/PWA (Phase 4) delivers the primary mobile need at lower cost |
| Real-time social feed | Collaboration requirements are met by team membership and commentary |
| ERP general-ledger benefit verification | Requires Finance system ownership; tracked as a Phase 4 dependency |
| Custom model training | Platform uses pre-trained/served models; training is out of scope |
| Cross-organization idea sharing | Multi-tenant isolation, not cross-tenant federation |

### 2.3 Target Outcomes

| Outcome | Measurement | Year-1 Target |
| :--- | :--- | :--- |
| Participation depth | % of employees submitting at least one idea per year | ≥ 40% |
| Implementation rate | Approved ideas implemented ÷ approved ideas | ≥ 50% |
| Value realisation | % of implemented ideas with recorded realised benefit | ≥ 80% |
| Documented value | Total realised annualised benefit (INR) | INR 50 Lakhs+ |
| Funnel efficiency | Median days from submission to committee decision | ≤ 12 business days |
| Workflow health | % of stage transitions completed within SLA | ≥ 90% |

### 2.4 Relationship to FRD v1.0

This document is written to coexist with `IdeaHub_Ideathon_FRD.md` v1.0, not to replace it.
v1.0 is a baselined, in-flight specification. This document:

- **Re-uses** v1.0 terminology, role definitions and stage names wherever the concept is
  unchanged.
- **Extends** the lifecycle with new stages (AI pre-screen, duplicate detection, business case,
  pilot, impact measurement) without removing any v1.0 stage.
- **Introduces** new capability areas not present in v1.0.
- **Remains subordinate** to v1.0 until formally baselined: where this document and v1.0
  conflict on an implemented feature, **v1.0 governs** and the conflict is raised as a change
  request.

**All new requirement IDs in this document use the `FR2-*` prefix**, so no ID collides with
v1.0's `FR-*` series and traceability between the two documents remains unambiguous.

---

## 3. Business Vision & Objectives

### 3.1 Vision Statement

> "To establish a centralised innovation ecosystem that converts employee creativity into
> measurable organisational value — capturing ideas intelligently, evaluating them rigorously,
> executing them visibly, and proving the return."

### 3.2 Strategic Objectives

| # | Objective | Key Result | Priority |
| :--- | :--- | :--- | :--- |
| SO-1 | Innovation Culture Development | Innovation Index improves ≥ 20% YoY | P1 |
| SO-2 | Process Improvement | Measurable improvement documented in ≥ 25 processes | P1 |
| SO-3 | Cost Optimization | Quantified cost reduction from implemented ideas | P1 |
| SO-4 | Employee Engagement | ≥ 40% of employees submit at least one idea annually | P2 |
| SO-5 | Business Growth | Employee-led revenue and business opportunities captured | P2 |
| SO-6 | Innovation Governance | Transparent, audited decision-making at every stage | P1 |
| SO-7 | **Value Realisation** *(new)* | ≥ 50% of approved ideas reach implementation | P1 |
| SO-8 | **Portfolio Balance** *(new)* | Innovation spend aligned to declared strategic objectives | P2 |

### 3.3 Strategic Alignment Objectives

Every idea must be tagged against at least one declared organisational objective. These
objectives are admin-configurable and drive executive alignment reporting (§11.4).

| Code | Strategic Objective |
| :--- | :--- |
| SO-COST | Cost Reduction |
| SO-REV | Revenue Growth |
| SO-CX | Customer Experience |
| SO-EX | Employee Experience |
| SO-DX | Digital Transformation |
| SO-SUS | Sustainability |
| SO-AUTO | Process Automation |
| SO-RISK | Risk Reduction |
| SO-COMP | Compliance |

---

## 4. Platform Concept: The Shift from Idea Collection to Value Management

### 4.1 Conceptual Lifecycle (v2.0)

```
Submit Idea
    ↓
AI Pre-Screen (quality, completeness, duplicate check)
    ↓
Supervisor Review
    ↓
Department Evaluation
    ↓
Committee Evaluation
    ↓
Committee Voting
    ↓
Business Case (cost, benefit, ROI, payback)
    ↓
DECISION ── Approved ──→ Implementation Owner
           ├ Rejected ──→ Closed
           └ Deferred ──→ Re-enters queue with reason
    ↓
Pilot / Experiment
    ↓
Scale Decision ──→ Full Implementation
    ↓
Impact Measurement (before vs after metrics)
    ↓
Realised Benefit + ROI Confirmation
    ↓
Innovation Gallery + Portfolio Roll-up
```

### 4.2 Conceptual Architecture

```
                          ┌──────────────────────┐
                          │       IDEA HUB       │
                          └──────────┬───────────┘
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
   ┌────▼─────┐                ┌─────▼──────┐               ┌─────▼─────┐
   │ IDEATION │                │ EVALUATION │               │ EXECUTION │
   ├──────────┤                ├────────────┤               ├───────────┤
   │ Submit   │                │ Supervisor │               │ Owner     │
   │ Assist   │                │ Evaluator  │               │ Workspace │
   │ Duplicate│                │ Committee  │               │ Tasks     │
   │ Challenge│                │ 360° View  │               │ Milestone │
   │ Events   │                │ Scoring    │               │ Progress  │
   │ Collab   │                │ Voting     │               │ Budget    │
   │ Capture  │                │ SLA        │               │ Pilot     │
   └──────────┘                └────────────┘               └───────────┘
        │                            │                            │
        └────────────────────────────┼────────────────────────────┘
                                     │
                        ┌────────────▼────────────┐
                        │      INTELLIGENCE        │
                        ├─────────────────────────┤
                        │ AI Assistant            │
                        │ Duplicate Detection     │
                        │ AI Categorisation       │
                        │ Trend Analysis          │
                        │ Executive Insights      │
                        ├─────────────────────────┤
                        │ Analytics · ROI         │
                        │ Heatmap · Portfolio     │
                        └─────────────────────────┘
                                     │
                        ┌────────────▼────────────┐
                        │        OUTCOMES         │
                        │ Gallery · Impact · ROI  │
                        │ Recognition · Reports   │
                        └─────────────────────────┘
```

---
## 5. System Overview & Capability Map

### 5.1 Platform Description

IdeaHub Enterprise is a centralised innovation management platform that manages the innovation
value chain end to end. It combines structured human judgement (supervisor, department,
committee) with AI assistance (pre-screening, similarity, categorisation, trend analysis),
binds every approved idea to a quantified business case, tracks execution through to measured
impact, and rolls realised value up into a management portfolio view.

### 5.2 Core Functional Capabilities

| # | Capability | Description | Phase |
| :--- | :--- | :--- | :--- |
| C-01 | Idea Lifecycle 2.0 | Extended gated lifecycle from submission to realised impact | 1 |
| C-02 | AI Pre-Screening & Quality Gate | Automated completeness, quality and duplication check before human review | 2 |
| C-03 | AI Idea Assistant | Structured suggestions to improve, categorise and enrich a draft idea | 2 |
| C-04 | Duplicate Idea Detection | Semantic similarity surfacing existing or overlapping ideas | 2 |
| C-05 | Business Case & ROI | Cost, benefit, payback and ROI captured for every idea | 3 |
| C-06 | Strategic Alignment | Ideas tagged to declared organisational objectives | 3 |
| C-07 | Innovation Challenges | Time-boxed campaigns targeted at a specific problem or goal | 1 |
| C-08 | Innovation Portfolio | Hierarchical portfolio view of the innovation pipeline | 3 |
| C-09 | Executive Dashboard | Funnel, value, participation and health metrics for leadership | 1 |
| C-10 | SLA & Bottleneck Monitoring | Per-stage turnaround tracking with breach alerting | 1 |
| C-11 | Smart Notifications | Event-driven, role-targeted, deadline-aware notifications | 1 |
| C-12 | Idea → Delivery Integration | Convert approved ideas into delivery work items | 4 |
| C-13 | Implementation Workspace | Owner-facing execution workspace with tasks, milestones, budget | 1 |
| C-14 | Pilot / Experiment Stage | Controlled trial with before/after measurement and scale decision | 1 |
| C-15 | Impact Measurement | Before/after metric capture validating realised benefit | 3 |
| C-16 | Employee Recognition | Innovation profile, badges and contribution scoring | 1 |
| C-17 | Professional Gamification | Points and ranks, restrained and business-appropriate | 1 |
| C-18 | Enterprise Security | SSO/SCIM/RBAC/object-level authorisation | 4 |
| C-19 | Complete Audit Timeline | Immutable per-idea event history | 1 |
| C-20 | Advanced Search | Multi-facet filtering, sorting and saved searches | 1 |
| C-21 | Cross-Department Collaboration | Idea teams with SMEs and partner departments | 1 |
| C-22 | Rich Attachments | Documents, media and external design/delivery links | 1 |
| C-23 | Mobile / PWA | Installable, voice-assisted responsive experience | 4 |
| C-24 | Multi-Department Tenancy | Per-department categories, committees, challenges and KPIs | 4 |
| C-25 | AI Executive Insights | Narrative insights and bottleneck analysis for leadership | 2 |

---

## 6. User Roles & Access Responsibilities

### 6.1 Roles

| Role | Core Responsibilities | Key Permissions |
| :--- | :--- | :--- |
| Employee / Associate | Submit ideas; participate in challenges; track own ideas; view published innovations | Create Idea, Use AI Assistant, Join Challenges, View Gallery, View Own Idea |
| Supervisor | Validate employee ideas; approve/reject/return; monitor team pipeline and SLA | View Team Ideas, Approve/Reject/Return, Team Reports, Team SLA View |
| Department Innovation Team | Evaluate and score ideas; shortlist; reject at department level | Evaluate, Score, Shortlist, Reject, Department Reports, Department SLA View |
| Innovation Committee | Final evaluation; strategic assessment; approve, defer or reject; assign implementation owner | Approve for Publishing, Approve for Implementation, Reject, Defer, Assign Owner, 360° View, Vote |
| Implementation Owner | Execute approved ideas; manage workspace; run pilot; record impact and benefits | Manage Workspace, Update Milestones, Manage Tasks/Budget, Run Pilot, Record Impact & Benefits |
| Idea Team Member | SME or partner-department contributor to a specific idea | View Idea, Comment, Attach Evidence, View Status (scoped) |
| Management / Executive | Oversight; portfolio and value review | Executive Dashboard, Portfolio View, Reports, AI Insights |
| Administrator | Full system governance: users, roles, config, workflows, master data | Full System Access, User & Role Management, Configuration, All Reports, Audit Viewer |
| Integration Service Account | Machine identity for webhook delivery and API consumption | Scoped API token, webhook subscription management |

### 6.2 Role-Based Access Control Principles

| Req ID | Requirement | Priority |
| :--- | :--- | :--- |
| FR2-SEC-01 | Access shall be enforced by RBAC at both UI and API level; no screen may rely solely on hidden UI controls for protection | MUST HAVE |
| FR2-SEC-02 | Authorization shall be enforced at object level (a user who can reach an idea's URL must still be authorised against that specific idea) | MUST HAVE |
| FR2-SEC-03 | Committee and idea-visibility permissions shall be configurable; visibility defaults to "all authenticated employees" but may be scoped to a department or committee | MUST HAVE |
| FR2-SEC-04 | Every privileged action shall be attributable to an authenticated user with a recorded timestamp | MUST HAVE |

> Note: FR2-SEC-02 restates as a platform requirement the object-level authorisation already
> enforced in the current IdeaHub implementation (`authorizationService.canAccessIdea`,
> `canAccessImplementation`, `canAccessBenefit`). It is carried forward so it is not regressed.

---

## 7. Idea Lifecycle 2.0

### 7.1 Lifecycle Stages

The v1.0 lifecycle is retained in full. v2.0 inserts additional stages and one optional branch.

| Stage | Stage Name | Responsible Role | Permitted Actions | SLA / Target TAT |
| :--- | :--- | :--- | :--- | :--- |
| 0 | AI Pre-Screen *(new)* | System | Quality check, completeness check, duplicate flag, categorisation suggest | Automatic, < 5 seconds |
| 1 | Idea Creation | Employee / Associate | Draft, Enhance with AI, Submit | Anytime |
| 2 | Supervisor Validation | Immediate Supervisor | Approve, Reject, Return for Clarification | 3 Business Days |
| 3 | Department Innovation Review | Dept. Innovation Team | Evaluate, Score, Shortlist, Reject | 5 Business Days |
| 4 | Innovation Committee Review | Innovation Committee | Request Business Case, Approve for Publishing, Approve for Implementation, Reject, Defer | 7 Business Days |
| 5 | Business Case Review *(new)* | Committee + Finance Partner | Review cost/benefit/ROI; Approve, Reject, Defer | 5 Business Days |
| 6 | Pilot / Experiment *(new)* | Implementation Owner | Define pilot scope, Run pilot, Record results, Recommend Scale | 4–12 weeks |
| 7 | Published | System / Admin | Visible org-wide | Auto on Approval |
| 8 | Implementation | Implementation Owner | Update progress, manage tasks/milestones/budget | Per Plan |
| 9 | Impact Measurement *(new)* | Implementation Owner / Finance | Capture before/after metrics, validate benefit | Within 30 days of completion |
| 10 | Benefit Realisation | Implementation Owner / Finance | Record actual benefits, confirm ROI | Post-Impact |
| 11 | Outcome Tracking & Closure | Innovation Committee / Admin | Monitor, Close | Ongoing |

### 7.2 Lifecycle Rules

| Req ID | Requirement | Priority |
| :--- | :--- | :--- |
| FR2-LC-01 | No idea may skip a stage without an authorised Administrator override, which shall require a recorded justification | MUST HAVE |
| FR2-LC-02 | The Pilot stage shall be **optional**: an idea may proceed directly from Business Case approval to Implementation. Where skipped, the reason shall be recorded | MUST HAVE |
| FR2-LC-03 | A Deferred idea shall re-enter its prior evaluation queue with the deferral reason visible to all reviewers | MUST HAVE |
| FR2-LC-04 | Every status transition shall record actor, timestamp, from-status, to-status and reason where applicable | MUST HAVE |
| FR2-LC-05 | The submitter shall be able to view the complete status trail at all times | MUST HAVE |
| FR2-LC-06 | An idea rejected at any gate shall remain queryable and re-submittable by its owner after revision; rejection shall be final only after the rejection is issued | SHOULD HAVE |
| FR2-LC-07 | AI Pre-Screen shall never auto-reject an idea; it may only flag, warn or request clarification | MUST HAVE |

> FR2-LC-07 is deliberate: automated judgement must not remove an employee's route to
> consideration. The AI layer informs, humans decide.

### 7.3 Idea Journey Status Trail

```
Draft → AI Screened → Submitted → Under Supervisor Review
   → Supervisor Approved / Returned / Rejected
   → Under Department Evaluation → Shortlisted / Rejected by Dept.
   → Under Committee Review → Business Case Requested
   → Business Case Submitted → Approved for Publishing / Approved for Implementation
       / Rejected / Deferred
   → Pilot Running → Pilot Results Recorded → Scale Decision
   → Published
   → Implementation Initiated → Implementation In Progress → Implementation Completed
   → Impact Measured → Benefits Recorded → Outcome Monitored → Closed
```

---

## 8. Detailed Functional Requirements — Core Platform

### 8.1 AI Pre-Screening & Quality Gate (Stage 0)

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-AI-01 | On draft creation the system shall run an automated pre-screen returning: completeness score, quality score, flagged gaps, suggested category, suggested department, and similar-idea matches | MUST HAVE (Phase 2) | Pre-screen result returned within 5 seconds of draft save |
| FR2-AI-02 | The pre-screen shall identify missing mandatory content (e.g. absent problem statement, absent outcome) and display actionable prompts on the submission form | MUST HAVE (Phase 2) | Each gap displayed as a specific, actionable message |
| FR2-AI-03 | Pre-screen results shall be advisory only; the submitter may submit despite any advisory warning | MUST HAVE (Phase 2) | Submission succeeds with warnings acknowledged |
| FR2-AI-04 | The pre-screen outcome and its score shall be recorded and visible to reviewers | SHOULD HAVE (Phase 2) | Visible on the idea detail page and in the audit timeline |

### 8.2 AI Idea Assistant

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-AIA-01 | The system shall provide an "Enhance with AI" action on the idea form generating, from the submitter's raw text: a detected Problem Statement, a Suggested Outcome, a Suggested Category, a Suggested Department, Potential Benefits, and Potential Risks | MUST HAVE (Phase 2) | All six outputs generated from a single input of ≥ 50 characters |
| FR2-AIA-02 | Suggested content shall be inserted into the form as **editable drafts**, never auto-submitted on the submitter's behalf | MUST HAVE (Phase 2) | Submitter explicitly accepts each suggestion; original text remains recoverable |
| FR2-AIA-03 | The assistant shall surface similar existing ideas with a similarity percentage and a link to each | MUST HAVE (Phase 2) | At least the top 3 matches shown with score and link |
| FR2-AIA-04 | The assistant shall offer improvement actions: improve description, suggest outcome, find similar ideas, suggest category, identify risks, generate business case skeleton | MUST HAVE (Phase 2) | All six actions available and individually invocable |
| FR2-AIA-05 | AI output shall be labelled as AI-generated wherever it is displayed | MUST HAVE (Phase 2) | Visible AI provenance indicator on every AI-produced field |
| FR2-AIA-06 | If the AI service is unavailable, the form shall remain fully usable and the feature shall degrade gracefully without data loss | MUST HAVE (Phase 2) | Draft content preserved; user informed; no blocking error |

### 8.3 Duplicate Idea Detection

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-DUP-01 | Before submission the system shall check for similar existing ideas and present matches with a similarity percentage | MUST HAVE (Phase 2) | Matches shown with title, idea reference, and similarity % |
| FR2-DUP-02 | The submitter shall be offered "View Existing Idea" and "Continue Anyway"; continuing shall be permitted | MUST HAVE (Phase 2) | Both paths available; continuing is never blocked |
| FR2-DUP-03 | A submitted idea exceeding a configurable similarity threshold shall be flagged as a potential duplicate to reviewers | MUST HAVE (Phase 2) | Flag visible on the review screen with the matched idea |
| FR2-DUP-04 | A submitter who declares a relationship to an existing idea (e.g. "extension of", "supersedes") shall have the ideas linked, and the linkage shall be visible to reviewers | SHOULD HAVE (Phase 2) | Bidirectional link visible on both idea pages |
| FR2-DUP-05 | Consolidation of multiple similar ideas into a single parent idea shall be possible by an Administrator, with all child ideas retained and traceable | SHOULD HAVE (Phase 3) | Consolidation preserves each child's history and contribution credit |

### 8.4 SLA & Bottleneck Monitoring

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-SLA-01 | Each lifecycle stage shall carry a configured SLA in business days, excluding weekends and configured public holidays | MUST HAVE | SLA calculated excluding non-business days |
| FR2-SLA-02 | Each idea shall display per-stage elapsed time, SLA status (on track / at risk / breached), and remaining days | MUST HAVE | All three values visible on the idea detail page |
| FR2-SLA-03 | The system shall generate an overdue list, broken down by pending actor role (Supervisor, Evaluator, Committee), visible to the Administrator | MUST HAVE | Counts per role displayed; drill-down to the specific ideas |
| FR2-SLA-04 | Reviewers shall see their own pending items with days remaining and at-risk warnings | MUST HAVE | Personal review queue shows SLA status per item |
| FR2-SLA-05 | Escalation on breach shall be configurable per stage (notify reviewer, notify reviewer and admin, auto-escalate) | SHOULD HAVE | Escalation action configurable per stage in Admin |
| FR2-SLA-06 | SLA targets shall be configurable globally and overridden per Ideathon / Challenge | SHOULD HAVE | Per-event override supported |

### 8.5 Smart / Event-Driven Notifications

Notifications shall be generated by domain events rather than by hard-coded per-screen triggers.

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-NTF-01 | Notifications shall be event-driven, triggered by workflow and lifecycle events | MUST HAVE | Notification matrix maps events → recipient roles → channels |
| FR2-NTF-02 | The submitter shall be notified on every status change of their idea, stating the previous and new status | MUST HAVE | Notification contains old → new status |
| FR2-NTF-03 | Reviewers shall be notified when items enter their queue, including a count of items awaiting them | MUST HAVE | Queue-depth notification with actionable count |
| FR2-NTF-04 | Reviewers shall receive deadline reminders before an SLA breach (configurable lead time) | MUST HAVE | Reminder fires ahead of breach per configuration |
| FR2-NTF-05 | Committee members shall be notified of voting open and close times | MUST HAVE | Open and close notifications delivered |
| FR2-NTF-06 | An Implementation Owner shall be notified on assignment to an idea | MUST HAVE | Assignment notification delivered with idea link |
| FR2-NTF-07 | Notification preferences shall be configurable per user per channel; mandatory governance notifications shall not be suppressible | SHOULD HAVE | User preferences applied; mandatory notifications exempt |
| FR2-NTF-08 | Notifications shall be delivered in-app and by email; additional channels (Teams) are Phase 4 | SHOULD HAVE | In-app and email functional in Phase 1 |

### 8.6 Complete Audit Timeline

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-AUD-01 | Every idea shall display a complete, immutable timeline of events including submission, assignment, each approval/rejection/return, score changes, owner assignment, status changes, and benefit recording | MUST HAVE | Full timeline visible on the idea detail page |
| FR2-AUD-02 | Each timeline entry shall record actor, role at time of action, timestamp, action and any justification text | MUST HAVE | All five attributes present on every entry |
| FR2-AUD-03 | Audit entries shall be append-only and shall not be editable or deletable by any user, including Administrators | MUST HAVE | No update/delete path exists for audit records |
| FR2-AUD-04 | The audit timeline shall be exportable per idea and org-wide, filterable by user, action, entity and date range | SHOULD HAVE | Export available; filters applied |

### 8.7 Advanced Search & Idea Directory

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-SRC-01 | The Idea Directory shall support free-text search across title, description, problem statement and outcome | MUST HAVE | Results update as the user types (debounced) |
| FR2-SRC-02 | Filtering shall be supported on: Department, Category, Status, Financial Year, Event/Challenge, Supervisor, Evaluator, Committee, Priority, Strategic Objective, Implementation Owner, ROI band, Impact band, and Date Range | MUST HAVE | All listed filters present and combinable |
| FR2-SRC-03 | Results shall be sortable by: Most Recent, Highest Impact, Highest ROI, Most Voted, Most Commented, and Fastest Implementation | MUST HAVE | All six sort options functional |
| FR2-SRC-04 | Users shall be able to save a filtered search and retrieve it later | SHOULD HAVE | Saved searches persist per user |
| FR2-SRC-05 | Search results shall respect the caller's role-based and object-level visibility | MUST HAVE | No result returned that the user could not open directly |
| FR2-SRC-06 | Filter and sort state shall be reflected in the URL so a view can be shared and bookmarked | SHOULD HAVE | URL restores identical result set |

### 8.8 Cross-Department Collaboration

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-COL-01 | An idea shall support an Idea Team comprising: Idea Owner, Supervisor, Evaluator, Subject Matter Experts, and partner-department contributors | MUST HAVE (Phase 2) | Team roster visible on the idea |
| FR2-COL-02 | Team members shall be added by the owner or an Administrator, with the invitee's consent recorded | MUST HAVE (Phase 2) | Addition logged in the audit timeline |
| FR2-COL-03 | Team members shall be able to comment and attach evidence within their scoped access | MUST HAVE (Phase 2) | Commenting restricted to team members and reviewers |
| FR2-COL-04 | Team membership shall grant no additional decision rights; voting and approval remain role-restricted | MUST HAVE | Team member cannot vote or approve |
| FR2-COL-05 | Contribution credit for recognition purposes shall be attributed across team members | SHOULD HAVE | Recognition reflects shared contribution |

### 8.9 Rich Attachments & External Links

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-ATT-01 | The system shall accept attachments of type: Image, PDF, Excel, PowerPoint, Video, Audio | MUST HAVE | All six types accepted within configured size limits |
| FR2-ATT-02 | Attachments shall be virus-scanned before being made accessible to reviewers | MUST HAVE | Infected files rejected and logged |
| FR2-ATT-03 | Attachments shall be access-controlled: an attachment shall never be more visible than the idea it belongs to | MUST HAVE | Protected URLs return 403 for unauthorised users |
| FR2-ATT-04 | Users shall be able to attach external references by URL, typed as: Prototype, Design (Figma), Delivery Item (Azure DevOps / Jira), Document | MUST HAVE (Phase 4 for delivery links) | Typed external links rendered with provider metadata |
| FR2-ATT-05 | Attachment metadata (name, type, size, uploader, timestamp) shall be visible and removable only by the uploader or an Administrator | MUST HAVE | Removal permissions enforced |

### 8.10 Implementation Workspace

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-IMP-01 | An approved idea shall have an Implementation Workspace owned by the assigned Implementation Owner | MUST HAVE | Workspace created on owner assignment |
| FR2-IMP-02 | The workspace shall display: owner, department, start date, target date, progress percentage, and budget consumed vs allocated | MUST HAVE | All six fields displayed and editable by the owner |
| FR2-IMP-03 | The workspace shall support a task list with standard implementation phases (Requirement Analysis, Design, Development/Procurement, Testing, Deployment) and completion state | MUST HAVE | Phase checklist with completion tracking |
| FR2-IMP-04 | Progress percentage shall be derived from completed milestones or tasks rather than entered manually | MUST HAVE | Progress auto-calculated; manual override requires justification |
| FR2-IMP-05 | Budget consumption shall be tracked against the approved business case cost estimate, with variance surfaced | MUST HAVE | Variance shown as absolute and percentage |
| FR2-IMP-06 | The workspace shall display progress to the submitter, committee and administrator without exposing internal task commentary | SHOULD HAVE | Progress visible; internal notes restricted to owner and admins |
| FR2-IMP-07 | The workspace shall link back to the originating idea and its business case | MUST HAVE | Bidirectional navigation |

### 8.11 Pilot / Experiment Stage

Not every idea should become a full project immediately. This stage enables controlled trial
before organisation-wide commitment.

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-PIL-01 | An approved idea shall be able to enter a Pilot stage before full implementation | MUST HAVE | Pilot stage available from approved business case |
| FR2-PIL-02 | The pilot shall record scope (e.g. which departments, locations or user groups), start and end dates, and success criteria | MUST HAVE | All four recorded before pilot start |
| FR2-PIL-03 | The pilot shall capture before-metrics and after-metrics for each success criterion and compute the improvement | MUST HAVE | Improvement % computed and displayed |
| FR2-PIL-04 | The owner shall record a scale recommendation: Scale, Modify, or Abandon, with justification | MUST HAVE | Recommendation and rationale mandatory |
| FR2-PIL-05 | On a Scale recommendation the idea shall progress to full Implementation, reusing the pilot's validated approach and metrics | MUST HAVE | Pilot results carried into implementation |
| FR2-PIL-06 | On Abandon, the pilot shall be closed with the learning recorded and shall remain visible in reporting as a negative result | SHOULD HAVE | Closed pilot visible in portfolio |

### 8.12 Employee Recognition

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-REC-01 | Each employee shall have an Innovation Profile showing ideas submitted, approved, implemented, and contribution to realised value | MUST HAVE | Four metrics displayed |
| FR2-REC-02 | An Innovation Score shall be computed from contributions and shall be visible to the employee and to management | MUST HAVE | Score visible; formula documented and disclosed to the user |
| FR2-REC-03 | Badges shall be awarded for defined achievements (e.g. Idea Generator, Implementation Champion, Collaboration Leader, Top Innovator) | MUST HAVE | Badges award and display on profile |
| FR2-REC-04 | Recognition shall recognise implemented and impact-generating work, not only idea volume | MUST HAVE | Implementation and impact weighted in scoring |
| FR2-REC-05 | Recognition data shall be visible only to the employee, their management, and administrators | MUST HAVE | Peer-level visibility not permitted |
| FR2-REC-06 | Recognition data shall be exportable for integration with HR reward and recognition programmes | SHOULD HAVE | Export format defined |

### 8.13 Professional Gamification

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-GAM-01 | Innovation Points shall accrue for submission, evaluation participation, implementation and impact delivery | MUST HAVE | Points accrued per defined event |
| FR2-GAM-02 | Points and rank shall be visible on the user's Innovation Profile | MUST HAVE | Points and rank displayed |
| FR2-GAM-03 | The visual language shall remain consistent with a premium corporate identity — restrained badges, no cartoon avatars, no childish animations, no cluttered leaderboards | MUST HAVE | Design review confirms corporate tone |
| FR2-GAM-04 | Leaderboards shall be opt-in for the individual and shall never be the default landing experience | MUST HAVE | Participation in public ranking requires explicit opt-in |
| FR2-GAM-05 | Points shall never be awarded for volume alone; quality-weighted criteria shall dominate the formula | MUST HAVE | Formula reviewed and documented before release |
| FR2-GAM-06 | Gamification shall be disable-able organization-wide by configuration | SHOULD HAVE | Admin toggle removes all points and ranks |

### 8.14 Innovation Challenges

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-CHL-01 | An Administrator shall be able to create a Challenge with: title, Problem, Goal, target Department, start and end dates, target idea count, and optional prize/recognition | MUST HAVE | All fields captured |
| FR2-CHL-02 | A Challenge shall be open for idea submission only within its date window | MUST HAVE | Submissions outside the window rejected |
| FR2-CHL-03 | A Challenge shall appear as a dedicated submission context and a browsable listing | MUST HAVE | Challenge list and detail pages available |
| FR2-CHL-04 | Participation shall be tracked per Challenge with submission and conversion counts | MUST HAVE | Participation and conversion reported per challenge |
| FR2-CHL-05 | A Challenge may be extended by an Administrator with a recorded justification, notifying participants | MUST HAVE | Justification ≥ 20 characters; participants notified |
| FR2-CHL-06 | Challenge results shall be reportable independently of the general Ideathon event model | SHOULD HAVE | Challenge report distinct from event report |

---

## 9. Detailed Functional Requirements — AI & Intelligence Layer

All requirements in this section are **Phase 2** unless stated otherwise. AI capability is
advisory throughout: it informs and accelerates human judgement, and never substitutes for it.

### 9.1 AI Principles & Governance

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-AIG-01 | No AI capability shall make a binding decision on an idea's outcome | MUST HAVE | No AI path transitions an idea to rejected/approved |
| FR2-AIG-02 | All AI-generated content shall be labelled with provenance and shall be distinguishable from human-authored content | MUST HAVE | Provenance indicator present on every AI output |
| FR2-AIG-03 | The organisation shall maintain an inventory of AI capabilities in use, with owner and purpose, reviewable by the Administrator | MUST HAVE | AI inventory viewable in Admin |
| FR2-AIG-04 | AI processing shall occur only over data the user is already authorised to access; the AI layer shall not become a data-exposure path | MUST HAVE | Access-control tests confirm no privilege escalation via AI endpoints |
| FR2-AIG-05 | AI features shall be independently enable-able so a capability can be disabled without redeployment | MUST HAVE | Per-capability toggle in Admin |
| FR2-AIG-06 | Prompts and AI-derived data shall not be used to train third-party models | MUST HAVE | Terms documented and confirmed with the provider |
| FR2-AIG-07 | The system shall record which AI capabilities were applied to an idea, for later audit | SHOULD HAVE | Applied-capability list stored per idea |

### 9.2 AI Categorisation & Theme Detection

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-AIC-01 | The system shall auto-suggest category, sub-category and initiative for a submitted idea | MUST HAVE | Suggestions shown on submission with one-click accept |
| FR2-AIC-02 | An Administrator shall be able to define the controlled vocabulary (categories, initiatives) the AI is permitted to assign | MUST HAVE | Vocabulary limits AI assignment |
| FR2-AIC-03 | The system shall cluster ideas into emerging themes and surface theme-level trends over time | MUST HAVE | Theme clusters displayed with volume and period-over-period change |
| FR2-AIC-04 | Theme names and descriptions shall be editable by an Administrator after AI generation | SHOULD HAVE | Admin may rename or merge clusters |

### 9.3 AI Trend & Sentiment Intelligence

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-AIG-TR-01 | The system shall rank emerging themes by growth rate over selectable periods | MUST HAVE | Ranked theme list with % change and direction |
| FR2-AIG-TR-02 | The system shall produce natural-language trend statements (e.g. "AI/Automation ideas increased significantly over the last two quarters") | MUST HAVE | Statement generated from underlying data |
| FR2-AIG-TR-03 | Sentiment of reviewer commentary shall be analysed and surfaced at theme level | SHOULD HAVE | Sentiment shown per theme |
| FR2-AIG-TR-04 | Trend analysis shall respect the caller's data visibility scope | MUST HAVE | A user sees trends only over data they may access |

### 9.4 AI Executive Insights

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-EXI-01 | The system shall generate a periodic **AI Innovation Brief** in narrative form summarising: submission volume change, top contributing departments, fastest-growing categories, bottleneck counts, approved ideas lacking an owner, and estimated annualised savings from implemented ideas | MUST HAVE | Brief generated for a selectable period |
| FR2-EXI-02 | The system shall answer natural-language analytical questions over innovation data (e.g. "Why is evaluation slowing down?") and cite the underlying figures it used | MUST HAVE | Answer returned with cited supporting metrics |
| FR2-EXI-03 | Every AI insight shall link to the underlying data view so a user can verify it independently | MUST HAVE | Each insight links to its source dashboard/filter |
| FR2-EXI-04 | AI insights shall be clearly distinguished from computed metrics | MUST HAVE | Visual and textual distinction from system-computed KPIs |
| FR2-EXI-05 | Executives shall be able to acknowledge or dismiss an insight, feeding a relevance signal | SHOULD HAVE | Acknowledgement state recorded |
| FR2-EXI-06 | AI insights shall never assert a financial value that is not traceable to a recorded benefit record | MUST HAVE | Value claims traceable to source records |

---

## 10. Detailed Functional Requirements — Business Impact & Value

This section addresses the central shift of the platform: from approving ideas to **proving
what they were worth**.

### 10.1 Business Case

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-BC-01 | Every idea shall be able to carry a Business Case capturing: Implementation Cost, Estimated Annual Savings, Revenue Potential, Employees Impacted, Time Saved (hours/year) | MUST HAVE (Phase 3) | All five fields captured per business case |
| FR2-BC-02 | The system shall compute and display: Estimated Total Value, Potential ROI %, and Payback Period | MUST HAVE (Phase 3) | All three computed and shown, not entered by hand |
| FR2-BC-03 | Payback Period shall be expressed in months and derived from cost ÷ monthly value | MUST HAVE (Phase 3) | Formula documented and shown to the user |
| FR2-BC-04 | A business case shall be required before an idea can be approved for implementation, unless an Administrator records a documented exemption | MUST HAVE (Phase 3) | Approval blocked without business case unless exempted |
| FR2-BC-05 | Business cases shall be editable by the submitter until committee review, then locked for the review period and unlockable only by the Committee or Administrator | MUST HAVE (Phase 3) | Lock behaviour enforced and audited |
| FR2-BC-06 | A business case shall be versioned; changes after lock shall retain the prior version | MUST HAVE (Phase 3) | Prior versions retrievable |
| FR2-BC-07 | The AI assistant shall be able to generate a business case skeleton from the idea content, which the submitter then completes and validates | SHOULD HAVE (Phase 3) | Skeleton generated; all values editable and user-confirmed |

> FR2-BC-07 explicitly requires user validation. AI may propose a skeleton; it may not assert
> financial values as fact.

### 10.2 Realised Impact Measurement

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-IMP-ME-01 | On implementation completion, actual results shall be recorded against each business case metric | MUST HAVE (Phase 3) | Actual values recorded per metric |
| FR2-IMP-ME-02 | The system shall compute realised ROI by comparing realised benefit to actual implementation cost | MUST HAVE (Phase 3) | Realised ROI computed and displayed |
| FR2-IMP-ME-03 | Realised benefit values shall be endorsed or disputed by an authorised role, with the endorsing party recorded | MUST HAVE (Phase 3) | Endorsement state and endorser recorded |
| FR2-IMP-ME-04 | Realised value shall roll up to portfolio, department, category and organisation levels | MUST HAVE (Phase 3) | All four roll-up levels available |
| FR2-IMP-ME-05 | A rejected idea shall remain visible in portfolio reporting as a documented non-selection, supporting future re-submission | SHOULD HAVE | Rejected ideas queryable in reporting |
| FR2-IMP-ME-06 | Impact measurement shall be due within a configured window after implementation completion, with a reminder and escalation on lapse | MUST HAVE (Phase 3) | Reminder and escalation fire per configuration |

### 10.3 Strategic Alignment

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-STR-01 | Every idea shall be tagged with at least one strategic objective from the configured list | MUST HAVE (Phase 3) | At least one tag mandatory before submission |
| FR2-STR-02 | The strategic objective list shall be configurable by an Administrator, including additions and retirement | MUST HAVE (Phase 3) | Configurable list |
| FR2-STR-03 | Management reporting shall show the distribution of ideas, approvals, implementations and realised value across strategic objectives | MUST HAVE (Phase 3) | All four distributions available |
| FR2-STR-04 | Portfolio balance shall be analysable — e.g. over-investment in one objective, under-investment in another | SHOULD HAVE (Phase 3) | Balance analysis view available |

### 10.4 Innovation Portfolio

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-PRF-01 | The system shall provide a hierarchical portfolio view: Strategic Objective → Theme/Category → Idea | MUST HAVE (Phase 3) | Three-level hierarchy navigable |
| FR2-PRF-02 | Each portfolio level shall show: idea count, approved count, implemented count, estimated value, realised value, and average ROI | MUST HAVE (Phase 3) | All six metrics per node |
| FR2-PRF-03 | Consolidated/parent ideas shall appear at their portfolio position with their child ideas expandable beneath | MUST HAVE (Phase 3) | Child ideas visible under parent |
| FR2-PRF-04 | Portfolio shall be filterable by department, financial year, status and owner | MUST HAVE (Phase 3) | All filters functional |
| FR2-PRF-05 | Portfolio shall be exportable for management reporting | SHOULD HAVE (Phase 3) | Export available |

### 10.5 Idea → Delivery Integration

Once an idea is approved, it should connect to the systems where the work actually happens,
rather than stopping at "approved".

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-INT-AD-01 | An approved idea shall be convertible to an Azure DevOps work item (Epic/Feature/Task) with a one-click action | MUST HAVE (Phase 4) | Work item created and linked back to the idea |
| FR2-INT-AD-02 | An approved idea shall be convertible to a Jira issue with a one-click action | MUST HAVE (Phase 4) | Issue created and linked back |
| FR2-INT-AD-03 | Conversion shall carry across title, description, business case, owner, target date and priority | MUST HAVE (Phase 4) | All fields mapped |
| FR2-INT-AD-04 | The platform shall support conversion to an internal Implementation Plan where no external delivery tool is in use | MUST HAVE (Phase 3) | Internal plan created with tasks and milestones |
| FR2-INT-AD-05 | Linkage shall be bidirectional: work item state shall be readable from the idea | MUST HAVE (Phase 4) | State synchronisation one-way inbound at minimum |
| FR2-INT-AD-06 | Conversion shall be idempotent — repeated conversion shall not create duplicate work items | MUST HAVE (Phase 4) | Duplicate conversion prevented |
| FR2-INT-AD-07 | Conversion failures shall be surfaced to the owner and Administrator with diagnostic detail, and shall not leave the idea in an inconsistent state | MUST HAVE (Phase 4) | Failure is recoverable and visible |

---

## 11. Detailed Functional Requirements — Analytics & Executive Reporting

### 11.1 Executive Innovation Dashboard

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-DSH-01 | The executive dashboard shall display: Ideas Submitted, Ideas Implemented, Implementation Rate, Potential Value, Realised Value, Average Evaluation Time, Average Implementation Time, Employee Participation %, Active Challenges | MUST HAVE (Phase 1) | All nine KPIs displayed |
| FR2-DSH-02 | The dashboard shall display an **Idea Funnel** visualising Submitted → Screened → Evaluated → Approved → Implemented, with counts and conversion rates | MUST HAVE (Phase 1) | Funnel rendered with all stages and conversion percentages |
| FR2-DSH-03 | The dashboard shall display a **Department Innovation** comparison across departments by idea volume, approvals and implementation | MUST HAVE (Phase 1) | Comparative chart rendered per department |
| FR2-DSH-04 | All dashboard data shall be filterable by financial year, department, category and date range | MUST HAVE (Phase 1) | Filters applied across all visualisations |
| FR2-DSH-05 | Dashboard data shall be refreshed within a defined interval after any change, and shall indicate the time of last refresh | MUST HAVE | Staleness indicator present |
| FR2-DSH-06 | Every dashboard figure shall be traceable to the underlying idea records via drill-down | MUST HAVE | Each KPI links to its contributing records |
| FR2-DSH-07 | The dashboard shall be accessible to management and administrators, with role-appropriate scoping of what each viewer sees | MUST HAVE | Access and scoping enforced |

### 11.2 Innovation Heatmap

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-HMP-01 | The system shall render a **Department × Strategic Objective** matrix showing idea counts per cell | MUST HAVE (Phase 3) | Matrix rendered with all departments and objectives |
| FR2-HMP-02 | The system shall render a **Impact vs Feasibility** heatmap positioning each idea on two axes | MUST HAVE (Phase 3) | Each idea positioned by scored impact and feasibility |
| FR2-HMP-03 | Heatmap cells shall be colour-scaled and selectable; selecting a cell shall filter to the underlying ideas | MUST HAVE (Phase 3) | Cell selection filters to contributing ideas |
| FR2-HMP-04 | Heatmaps shall support both categorical and intensity shading modes | SHOULD HAVE | Both modes available |

### 11.3 Operational & Process Reporting

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-RPT-01 | Time-in-stage reporting shall be available per stage, showing average, median and 90th-percentile business days | MUST HAVE (Phase 1) | All three statistics computed in business days |
| FR2-RPT-02 | SLA breach reporting shall be available by stage, reviewer and period | MUST HAVE (Phase 1) | Breakdown available on all three dimensions |
| FR2-RPT-03 | Participation reporting shall show per-department and per-employee participation rates | MUST HAVE (Phase 1) | Both levels reported |
| FR2-RPT-04 | Value reporting shall distinguish estimated, committed and realised value | MUST HAVE (Phase 3) | All three value states reported distinctly |
| FR2-RPT-05 | Reports shall be exportable to Excel and PDF | MUST HAVE | Both formats available |
| FR2-RPT-06 | Reports shall be schedulable for periodic email delivery | SHOULD HAVE (Phase 2) | Scheduling configurable |

### 11.4 Executive Reporting Consistency

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-RPT-07 | Where the same metric appears on more than one report, it shall be computed by a single shared definition and shall not diverge between views | MUST HAVE | Metric definitions centralised; cross-view consistency test passes |

> FR2-RPT-07 responds to a class of defect seen in reporting products where the dashboard
> total and the report total disagree because each computes independently.

---

## 12. Detailed Functional Requirements — Governance, Security & Audit

### 12.1 Enterprise Authentication

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-IAM-01 | Authentication shall support Microsoft Entra ID (Azure AD) with OIDC/SAML SSO | MUST HAVE (Phase 4) | Users authenticate via corporate identity provider |
| FR2-IAM-02 | Authentication shall support LDAP integration for organisations using on-premise directories | SHOULD HAVE (Phase 4) | LDAP authentication functional |
| FR2-IAM-03 | Local credential authentication shall remain available as a fallback and for break-glass administrative accounts | MUST HAVE | Fallback path documented and access-controlled |
| FR2-IAM-04 | User provisioning and de-provisioning shall be supported via SCIM where the identity provider supports it | SHOULD HAVE (Phase 4) | Provisioning and de-provisioning verified end to end |
| FR2-IAM-05 | The system shall support multiple simultaneous identity providers without requiring redeployment | SHOULD HAVE (Phase 4) | Provider configurable via configuration |
| FR2-IAM-06 | First-login behaviour shall be defined (profile completion, department and manager mapping) | MUST HAVE (Phase 4) | First-login flow documented and tested |

### 12.2 Authorization & Access Control

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-AUTH-01 | Access control shall be role-based, with roles assignable per user and combinable | MUST HAVE | Multiple roles per user supported |
| FR2-AUTH-02 | Access shall additionally be enforced at object level: a user must be authorised against the specific idea, implementation or benefit record they request | MUST HAVE | Object-level checks present on all object routes |
| FR2-AUTH-03 | Department-level access scoping shall be configurable | SHOULD HAVE (Phase 4) | Per-department scoping configurable |
| FR2-AUTH-04 | Idea visibility shall be configurable per category or sensitivity, with a restricted class visible only to authorised roles | SHOULD HAVE (Phase 4) | Restricted-visibility ideas enforced end to end |
| FR2-AUTH-05 | Committee membership and quorum shall be configurable, with per-committee rules | SHOULD HAVE | Per-committee configuration supported |

### 12.3 Audit & Compliance

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-CMP-01 | The system shall maintain an immutable audit log of all create, update, delete, approval, rejection, status change, scoring, assignment and configuration actions | MUST HAVE | All action types captured |
| FR2-CMP-02 | Each audit record shall capture actor, role, action, target entity, before/after values where applicable, timestamp and request correlation identifier | MUST HAVE | All attributes recorded |
| FR2-CMP-03 | Audit logs shall be retained for the organisational records-retention period (minimum 7 years) | MUST HAVE | Retention policy configurable, minimum 7 years |
| FR2-CMP-04 | Audit logs shall not be modifiable or deletable by any application user | MUST HAVE | No write path exists outside retention management |
| FR2-CMP-05 | An Administrator shall be able to view and export audit logs filtered by user, action, entity, role and date range | MUST HAVE | All filters functional; export available |
| FR2-CMP-06 | Audit search shall be performant over the full retention volume | SHOULD HAVE | Query meets the performance NFR |

### 12.4 Data Protection

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-DP-01 | All data shall be encrypted in transit (TLS 1.2+) and at rest | MUST HAVE | Encryption verified in transit and at rest |
| FR2-DP-02 | Financial benefit data shall be visible only to authorised roles, since it carries commercial sensitivity | MUST HAVE | Benefit values access-controlled |
| FR2-DP-03 | Personal data shall be minimised; the system shall not store personally identifiable information beyond what the ideation workflow requires | MUST HAVE | Data inventory confirms minimisation |
| FR2-DP-04 | All data shall reside within India, per data-residency constraints | MUST HAVE | Deployment location confirmed compliant |
| FR2-DP-05 | Data export and deletion requests shall be supportable for individuals, subject to retention obligations | SHOULD HAVE (Phase 4) | Process defined and tested |
| FR2-DP-06 | Session management shall enforce inactivity timeout and secure cookie handling | MUST HAVE | Timeout and cookie flags enforced |

---

## 13. Detailed Functional Requirements — Platform & Ecosystem

### 13.1 API & Webhooks

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-API-01 | The platform shall expose a documented REST API for idea, evaluation, implementation, benefit and reporting data | MUST HAVE (Phase 4) | API documented and versioned |
| FR2-API-02 | The API shall be versioned so that breaking changes do not silently break consumers | MUST HAVE (Phase 4) | Version in path or header; deprecation policy documented |
| FR2-API-03 | API access shall require authentication via scoped service tokens or OAuth | MUST HAVE (Phase 4) | Unauthenticated access rejected |
| FR2-API-04 | API rate limits shall be applied per token | MUST HAVE (Phase 4) | Rate limits enforced and documented |
| FR2-API-05 | The platform shall emit signed webhooks for defined events (idea submitted, idea approved, implementation completed, benefit recorded) | MUST HAVE (Phase 4) | Events delivered with signature |
| FR2-API-06 | Webhook delivery shall include retry with backoff and a visible delivery log | MUST HAVE (Phase 4) | Retry and log functional |
| FR2-API-07 | Webhook subscriptions shall be self-service, with per-event selection | SHOULD HAVE (Phase 4) | Subscription management available |

### 13.2 Integration Framework

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-INT-01 | Integration with external systems shall use a consistent adapter pattern so adding a system does not require changes to core logic | MUST HAVE (Phase 4) | Adapter interface documented |
| FR2-INT-02 | Each integration shall be independently enable-able and configurable (credentials, endpoints) without code change | MUST HAVE (Phase 4) | Configuration-driven enablement |
| FR2-INT-03 | Integrations shall degrade gracefully: a failing external system shall not block core IdeaHub workflows | MUST HAVE | IdeaHub remains usable during integration outage |
| FR2-INT-04 | HRMS/Employee Directory synchronisation shall maintain user, department and reporting-structure data | MUST HAVE (Phase 4) | Sync verified with HRMS |
| FR2-INT-05 | Analytics/BI export shall provide aggregated idea and benefit datasets for external BI tooling | SHOULD HAVE (Phase 4) | Export available for BI consumption |

### 13.3 Mobile & Progressive Web App

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-MOB-01 | The platform shall be installable as a Progressive Web App with offline draft capability | MUST HAVE (Phase 4) | Installable; drafts survive offline |
| FR2-MOB-02 | The platform shall be fully usable on mobile browsers for: browsing, submitting, reviewing and voting | MUST HAVE | All four flows functional on a mobile viewport |
| FR2-MOB-03 | Voice capture shall convert spoken idea input into a structured draft idea, which the user then edits before submission | SHOULD HAVE (Phase 4) | Speech-to-structured-draft flow functional |
| FR2-MOB-04 | Camera capture shall allow attaching photos to an idea directly from a mobile device | SHOULD HAVE (Phase 4) | Camera attach functional |

### 13.4 Multi-Department / Multi-Organisation Structure

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR2-ORG-01 | The system shall model an Organisation containing Departments, each of which may maintain its own categories, supervisors, evaluators, committees, challenges and KPIs | MUST HAVE (Phase 4) | Per-department configuration supported |
| FR2-ORG-02 | Ideas shall be attributable to exactly one owning department, with optional cross-department collaboration | MUST HAVE | Ownership single-valued; collaboration multi-valued |
| FR2-ORG-03 | Committees shall be definable at organisation or department scope | MUST HAVE | Both scopes supported |
| FR2-ORG-04 | Cross-department idea access shall be configurable: organisation-wide visibility or departmental restriction | MUST HAVE | Both models supported |
| FR2-ORG-05 | Per-department KPI targets and dashboards shall be independently configurable | SHOULD HAVE | Per-department targets and views available |

---

## 14. Delivery Roadmap

The 25 capability areas are delivered across four phases. **Phase 1 makes the current platform
enterprise-ready; AI is deliberately absent from Phase 1.**

### 14.1 Phase 1 — Enterprise-Ready Core

**Objective**: Complete the lifecycle, governance, and reporting capabilities required for
enterprise-wide deployment, without AI dependency.

| Capability | Requirement IDs |
| :--- | :--- |
| Idea Lifecycle 2.0 (structural stages, rules) | FR2-LC-01…07 |
| SLA & Bottleneck Monitoring | FR2-SLA-01…06 |
| Smart / Event-Driven Notifications | FR2-NTF-01…08 |
| Complete Audit Timeline | FR2-AUD-01…04 |
| RBAC & Object-Level Authorization Principles | FR2-SEC-01…04 |
| Audit & Compliance Recording | FR2-CMP-01…06 |
| Advanced Search & Idea Directory | FR2-SRC-01…06 |
| Implementation Workspace | FR2-IMP-01…07 |
| Pilot / Experiment Stage | FR2-PIL-01…06 |
| Innovation Challenges | FR2-CHL-01…06 |
| Employee Recognition & Professional Gamification | FR2-REC-01…06, FR2-GAM-01…06 |
| Executive Innovation Dashboard & Funnel | FR2-DSH-01…07 |
| Operational & Process Reporting | FR2-RPT-01…03, FR2-RPT-05…07 |
| Cross-Department Collaboration | FR2-COL-01…05 |
| Rich Attachments & External Links | FR2-ATT-01…03, FR2-ATT-05 |
| Internal Implementation Plan | FR2-INT-AD-04 |

### 14.2 Phase 2 — Intelligent Layer

**Objective**: Add AI assistance and advanced collaboration.

| Capability | Requirement IDs |
| :--- | :--- |
| AI Pre-Screening & Quality Gate | FR2-AI-01…04 |
| AI Idea Assistant | FR2-AIA-01…06 |
| Duplicate Idea Detection | FR2-DUP-01…04 |
| AI Governance & Principles | FR2-AIG-01…07 |
| AI Categorisation & Theme Detection | FR2-AIC-01…04 |
| AI Trend Intelligence | FR2-AIG-TR-01…04 |
| Duplicate Detection (core) | FR2-DUP-01…04 |
| AI Executive Insights | FR2-EXI-01…06 |
| Scheduled Report Delivery | FR2-RPT-06 |
| Rich Attachments — external delivery links | FR2-ATT-04 |

### 14.3 Phase 3 — Business Impact & Value

**Objective**: Bind every idea to quantified business value.

| Capability | Requirement IDs |
| :--- | :--- |
| Business Case & ROI Calculator | FR2-BC-01…07 |
| Realised Impact Measurement | FR2-IMP-ME-01…06 |
| Strategic Alignment | FR2-STR-01…04 |
| Innovation Portfolio | FR2-PRF-01…05 |
| Innovation Heatmap | FR2-HMP-01…04 |
| Value Reporting | FR2-RPT-04 |
| Duplicate Consolidation | FR2-DUP-05 |

### 14.4 Phase 4 — Enterprise Ecosystem

**Objective**: Enterprise identity, delivery-system integration, and multi-organisation scale.

| Capability | Requirement IDs |
| :--- | :--- |
| Enterprise Authentication (Entra ID, LDAP, SCIM) | FR2-IAM-01…06 |
| Authorization & Department Scoping | FR2-AUTH-03…05 |
| Idea → Azure DevOps / Jira Integration | FR2-INT-AD-01…03, FR2-INT-AD-05…07 |
| API & Webhooks | FR2-API-01…07 |
| Integration Framework & HRMS | FR2-INT-01…05 |
| Mobile / PWA | FR2-MOB-01…04 |
| Multi-Department / Multi-Organisation | FR2-ORG-01…05 |
| Data Protection — export & deletion | FR2-DP-05 |

### 14.5 Phase Dependencies & Sequencing Notes

- **Phase 1 is independent of Phase 2.** No Phase 1 requirement depends on an AI capability.
  This preserves the v1.0 position that AI is not a go-live dependency.
- **Phase 3 requires Phase 1** (FR2-LC lifecycle and workspace) but not Phase 2: business
  cases can be captured manually, with AI skeleton generation (FR2-BC-07) optional.
- **Phase 4 integration (FR2-INT-AD) requires Phase 3** so that a converted work item carries a
  business case.
- **Phase 4 identity (FR2-IAM) is independent** of Phases 2–3 and may be brought forward if
  the organisation requires SSO for go-live.

---

## 15. Non-Functional Requirements

### 15.1 Performance

| NFR ID | Category | Requirement | Priority |
| :--- | :--- | :--- | :--- |
| NFR2-P-01 | Page Load | All pages load within 3 seconds under normal load | MUST HAVE |
| NFR2-P-02 | Search | Search and filter results return within 2 seconds | MUST HAVE |
| NFR2-P-03 | Concurrency | Support ≥ 500 concurrent active users without degradation | MUST HAVE |
| NFR2-P-04 | AI Latency (Phase 2) | AI pre-screen and assistant responses return within 5 seconds | MUST HAVE |
| NFR2-P-05 | Report Generation | Standard reports generate within 10 seconds | SHOULD HAVE |
| NFR2-P-06 | Dashboard Freshness | Dashboard reflects a change within 5 minutes | MUST HAVE |
| NFR2-P-07 | Bulk Export (Phase 4) | Large exports complete asynchronously without blocking the UI | SHOULD HAVE |

### 15.2 Availability & Resilience

| NFR ID | Category | Requirement | Priority |
| :--- | :--- | :--- | :--- |
| NFR2-A-01 | Uptime | 99.9% uptime SLA; maintenance notified 48 hours ahead | MUST HAVE |
| NFR2-A-02 | DR | RTO ≤ 4 hours; RPO ≤ 1 hour for idea and implementation data | MUST HAVE |
| NFR2-A-03 | Scheduling | Scheduled jobs (SLA checks, notifications, auto-close) shall execute exactly once even across multiple application instances | MUST HAVE |
| NFR2-A-04 | External Dependency | An unavailable external system (AI, DevOps, Jira, HRMS) shall not degrade core IdeaHub workflows | MUST HAVE |

> NFR2-A-03 is a specific architectural constraint: current IdeaHub runs its scheduled jobs
> in-process with process-local deduplication state, which does not support multiple instances.
> This requirement exists to force that to an external scheduler or a distributed lock before
> horizontal scaling.

### 15.3 Security

| NFR ID | Category | Requirement | Priority |
| :--- | :--- | :--- | :--- |
| NFR2-S-01 | Access Control | RBAC enforced at UI and API level, with object-level enforcement | MUST HAVE |
| NFR2-S-02 | Encryption | TLS 1.2+ in transit; AES-256 at rest | MUST HAVE |
| NFR2-S-03 | Session | 30-minute inactivity timeout; secure, httpOnly cookie handling | MUST HAVE |
| NFR2-S-04 | Input Validation | All input validated server-side; no client-side-only validation | MUST HAVE |
| NFR2-S-05 | Injection Defence | NoSQL operator sanitisation and parameterised queries throughout | MUST HAVE |
| NFR2-S-06 | File Safety | Uploaded files scanned, type-validated, and served access-controlled | MUST HAVE |
| NFR2-S-07 | Secrets | No secrets in source control; all credentials via environment configuration | MUST HAVE |
| NFR2-S-08 | Rate Limiting | Rate limiting on authentication and write endpoints | MUST HAVE |
| NFR2-S-09 | AI Security | AI endpoints shall not expose data beyond the caller's own access scope | MUST HAVE |

### 15.4 Scalability

| NFR ID | Category | Requirement | Priority |
| :--- | :--- | :--- | :--- |
| NFR2-SC-01 | User Growth | Horizontal scaling to accommodate 10× user growth without redesign | MUST HAVE |
| NFR2-SC-02 | Data Volume | Handle 100,000+ ideas and 5+ years of data without performance degradation | SHOULD HAVE |
| NFR2-SC-03 | Statelessness | Application instances shall be stateless; no process-local authoritative state | MUST HAVE |
| NFR2-SC-04 | Concurrency Model | Scheduled jobs and caching shall be safe under multiple instances (see NFR2-A-03) | MUST HAVE |

### 15.5 Usability & Accessibility

| NFR ID | Category | Requirement | Priority |
| :--- | :--- | :--- | :--- |
| NFR2-U-01 | Accessibility | WCAG 2.1 Level AA compliance, verified by automated and manual audit | MUST HAVE |
| NFR2-U-02 | Browser Support | Chrome (latest 2), Edge, Firefox, Safari | MUST HAVE |
| NFR2-U-03 | Responsive | Usable on desktop, tablet and mobile browsers | MUST HAVE |
| NFR2-U-04 | Visual Identity | Premium corporate design language — restrained, professional, consistent | MUST HAVE |
| NFR2-U-05 | Empty & Error States | Every data view defines an empty, loading and error state | MUST HAVE |

### 15.6 Audit & Data Governance

| NFR ID | Category | Requirement | Priority |
| :--- | :--- | :--- | :--- |
| NFR2-G-01 | Audit Trail | Complete immutable audit log for all create, update, delete and approval actions | MUST HAVE |
| NFR2-G-02 | Retention | Idea data retained ≥ 7 years | MUST HAVE |
| NFR2-G-03 | Metric Consistency | A given metric shall have one definition across all views | MUST HAVE |
| NFR2-G-04 | Traceability | Every reported figure shall be traceable to its underlying records | MUST HAVE |

---

## 16. Assumptions, Dependencies & Constraints

### 16.1 Assumptions

* All users will be authenticated through the organisation's identity provider (Entra ID, LDAP
  or local credentials) before accessing IdeaHub.
* Employee master data — department hierarchy, reporting relationships, grade — will be
  available via HRMS API or a synchronised feed.
* An Innovation Committee with defined membership and quorum rules will be constituted before
  go-live.
* Department Innovation Teams will be formally identified and enrolled before Challenges launch.
* Email infrastructure (SMTP relay or Exchange) will be available for notification delivery.
* Finance or FP&A will partner on benefit validation; realised benefit values are recorded on
  good faith pending ERP general-ledger verification (a Phase 4 dependency).
* The organisation will define and maintain the strategic objective list (SO-COST … SO-COMP).
* Ideas submitted today carry no business case; business cases apply prospectively from the
  Phase 3 go-live date, with historical ideas optionally backfilled.
* AI capability will be provided via an approved service under enterprise terms (see §9.1
  FR2-AIG-06 on training-data usage).

### 16.2 Dependencies

* SSO / HRMS availability is a go-live prerequisite for Phase 4 identity scope.
* Evaluation criteria and scoring weights must be finalised by the Innovation Committee before
  the evaluation module can be configured.
* Department targets must be agreed by management before target tracking is activated.
* The AI service provider must be selected and contractually approved before Phase 2 delivery.
* Azure DevOps / Jira integration requires organisational licences and API access in the target
  projects.
* A Finance stakeholder must be named to own the business-case and impact-measurement model
  (Phase 3).

### 16.3 Constraints

* The platform must be deployed within existing infrastructure (on-premise or approved cloud).
* Data residency: all data must remain within India, per applicable data-protection regulation.
* The system must not store personally identifiable information beyond what the ideation
  workflow requires.
* Phase 1 delivery timeline per the project charter; scope additions require a formal change
  request.
* AI assistance is advisory. Any AI output entering a financial or governance record requires
  human confirmation (see FR2-BC-07, FR2-AIG-01).

---

## 17. Open Questions Requiring Stakeholder Decision

These are decisions that materially change scope or design and are **not** resolved by this
document. Each needs a named owner.

| # | Question | Impact if Unresolved | Suggested Owner |
| :--- | :--- | :--- | :--- |
| OQ-01 | Is a business case mandatory for approval for implementation, or advisory? | Determines whether FR2-BC-04 blocks the approval path | Innovation Committee |
| OQ-02 | What benefit values count as "realised" — estimated, committed, or Finance-endorsed? | Determines FR2-IMP-ME-03 endorsement semantics and value reporting | Finance / FP&A |
| OQ-03 | Is the Pilot stage mandatory, or opt-in per idea? | Determines whether FR2-PIL-01 gates the implementation path | Innovation Committee |
| OQ-04 | Do Recognition scores and gamification points require HR sign-off, and are they performance-review relevant? | Determines whether recognition data may be visible to HR and whether it is advisory-only | HR |
| OQ-05 | Which AI service and hosting model satisfies data-residency constraints? | Determines whether Phase 2 is deliverable at all within §16.3 | IT / Legal |
| OQ-06 | Is multi-department tenancy required at go-live, or deferred to Phase 4? | Determines whether Phase 1 data model anticipates a department hierarchy | Management |
| OQ-07 | Should SLA escalation be advisory (notify) or binding (auto-reassign, auto-advance)? | Determines FR2-SLA-05 escalation actions and governance risk | Innovation Committee |
| OQ-08 | Is Idea → Azure DevOps or Idea → Jira the primary Phase 4 integration? | Determines where delivery traceability effort is focused | IT |
| OQ-09 | What is the retention period for AI interaction logs and generated content? | Determines §9.1 storage policy and NFR2-G-02 interaction | IT / Legal |
| OQ-10 | Should consolidated (duplicate) ideas credit value to all contributors or the parent idea only? | Determines FR2-DUP-05 and recognition attribution | Innovation Committee |

---

## 18. Glossary of Terms

| Term / Abbreviation | Definition |
| :--- | :--- |
| AI Assistant | Advisory capability that structures, enriches and suggests improvements to a draft idea |
| Business Case | Quantified record of implementation cost, estimated benefit, ROI and payback for an idea |
| Business Day | Monday–Friday excluding configured public holidays (per IdeaHub holiday calendar) |
| Challenge | Time-boxed innovation campaign targeted at a specific problem or goal |
| Department Innovation Team | Role responsible for evaluating, scoring and shortlisting ideas |
| Duplicate Detection | Comparison of a new idea against existing ideas to surface similarity |
| Employee Participation | % of employees submitting at least one idea in a defined period |
| Entra ID | Microsoft's cloud identity platform (formerly Azure Active Directory), used for SSO |
| FRD | Functional Requirement Document — formal specification of required system functions |
| FRC / Quorum | Minimum proportion or count of committee members required for a decision |
| Idea Funnel | Visualisation of idea volume through each lifecycle gate with conversion rates |
| Impact Measurement | Recorded before/after metrics validating that an implemented idea delivered its expected outcome |
| Implementation Owner | Role accountable for executing an approved idea and recording its benefits |
| Innovation Committee | Body providing final evaluation, decision and strategic assessment |
| Innovation Portfolio | Hierarchical view of ideas organised by strategic objective and theme |
| Innovation Score | Computed measure of an employee's contribution to submitted, implemented and impact-generating ideas |
| IdeaHub | MPOnline's enterprise Innovation and Ideation Management Platform |
| Ideathon | A structured, time-bound innovation campaign or event inviting idea submissions on a theme |
| KPI | Key Performance Indicator — a quantifiable measure of objective success |
| NFR | Non-Functional Requirement — a quality attribute (performance, security, scalability) |
| Payout / Payback Period | Time required for cumulative benefit to recover implementation cost |
| Pilot | A controlled trial of an approved idea, with measured results and a scale decision |
| RBAC | Role-Based Access Control — restricting access according to assigned roles |
| Realised Value | Business benefit actually delivered and recorded, as distinct from estimated value |
| ROI | Return on Investment — (benefit − cost) ÷ cost, expressed as a percentage |
| SLA | Service Level Agreement — a commitment to act within a defined timeframe |
| Strategic Alignment | The mapping of an idea to one or more declared organisational objectives |
| TAT | Turnaround Time — elapsed time from initiation to completion of a process |
| WCAG | Web Content Accessibility Guidelines — international web accessibility standards |

---

## 19. Requirement Traceability Matrix

### 19.1 Coverage by Phase

| Phase | # Requirements | Primary Value |
| :--- | :--- | :--- |
| Phase 1 — Enterprise-Ready Core | 101 | Governance, throughput, visibility, execution discipline |
| Phase 2 — Intelligent Layer | 36 | Idea quality, reduced duplicate effort, faster insight |
| Phase 3 — Business Impact & Value | 28 | Proven ROI, portfolio balance, strategic traceability |
| Phase 4 — Enterprise Ecosystem | 38 | Identity, delivery integration, extensibility, multi-org scale |
| **Total** | **203** | — |

*Counts are machine-verified against the requirement tables in §8–§13: every `FR2-*` row is
counted once, and each is assigned to exactly one phase per the §14 roadmap table. Every
requirement prefix is contiguous from `-01` (no gaps, no duplicates). 33 non-functional
requirements (`NFR2-*`) are specified separately in §15 and are not included in the 203.*

### 19.2 Total Requirement Count

| Category | Prefix | Count | ID Range |
| :--- | :--- | :--- | :--- |
| Lifecycle | FR2-LC | 7 | 01–07 |
| AI Pre-Screen | FR2-AI | 4 | 01–04 |
| AI Idea Assistant | FR2-AIA | 6 | 01–06 |
| Duplicate Detection | FR2-DUP | 5 | 01–05 |
| SLA & Bottleneck | FR2-SLA | 6 | 01–06 |
| Notifications | FR2-NTF | 8 | 01–08 |
| Audit Timeline | FR2-AUD | 4 | 01–04 |
| Search & Directory | FR2-SRC | 6 | 01–06 |
| Collaboration | FR2-COL | 5 | 01–05 |
| Attachments | FR2-ATT | 5 | 01–05 |
| Implementation Workspace | FR2-IMP | 7 | 01–07 |
| Pilot / Experiment | FR2-PIL | 6 | 01–06 |
| Recognition | FR2-REC | 6 | 01–06 |
| Gamification | FR2-GAM | 6 | 01–06 |
| Challenges | FR2-CHL | 6 | 01–06 |
| AI Governance | FR2-AIG | 7 | 01–07 |
| AI Trend Intelligence | FR2-AIG-TR | 4 | 01–04 |
| AI Categorisation | FR2-AIC | 4 | 01–04 |
| AI Executive Insights | FR2-EXI | 6 | 01–06 |
| Business Case | FR2-BC | 7 | 01–07 |
| Impact Measurement | FR2-IMP-ME | 6 | 01–06 |
| Strategic Alignment | FR2-STR | 4 | 01–04 |
| Portfolio | FR2-PRF | 5 | 01–05 |
| Delivery Integration | FR2-INT-AD | 7 | 01–07 |
| Dashboard | FR2-DSH | 7 | 01–07 |
| Heatmap | FR2-HMP | 4 | 01–04 |
| Reporting | FR2-RPT | 7 | 01–07 |
| Enterprise Auth | FR2-IAM | 6 | 01–06 |
| Authorization | FR2-AUTH | 5 | 01–05 |
| RBAC Principles | FR2-SEC | 4 | 01–04 |
| Compliance | FR2-CMP | 6 | 01–06 |
| Data Protection | FR2-DP | 6 | 01–06 |
| API & Webhooks | FR2-API | 7 | 01–07 |
| Integration Framework | FR2-INT | 5 | 01–05 |
| Mobile / PWA | FR2-MOB | 4 | 01–04 |
| Organisation Structure | FR2-ORG | 5 | 01–05 |
| **Total** | **FR2-\*** | **203** | — |

Plus **33** non-functional requirements (`NFR2-*`) specified in §15, giving **236** traceable
requirements in this document.

### 19.3 Traceability to Capability Map

| Capability (§5.2) | Primary Requirements |
| :--- | :--- |
| C-01 Idea Lifecycle 2.0 | FR2-LC-01…07 |
| C-02 AI Pre-Screening | FR2-AI-01…04 |
| C-03 AI Idea Assistant | FR2-AIA-01…06 |
| C-04 Duplicate Detection | FR2-DUP-01…05 |
| C-05 Business Case & ROI | FR2-BC-01…07 |
| C-06 Strategic Alignment | FR2-STR-01…04 |
| C-07 Innovation Challenges | FR2-CHL-01…06 |
| C-08 Innovation Portfolio | FR2-PRF-01…05 |
| C-09 Executive Dashboard | FR2-DSH-01…07 |
| C-10 SLA Monitoring | FR2-SLA-01…06 |
| C-11 Smart Notifications | FR2-NTF-01…08 |
| C-12 Idea → Delivery | FR2-INT-AD-01…07 |
| C-13 Implementation Workspace | FR2-IMP-01…07 |
| C-14 Pilot Stage | FR2-PIL-01…06 |
| C-15 Impact Measurement | FR2-IMP-ME-01…06 |
| C-16 Recognition | FR2-REC-01…06 |
| C-17 Gamification | FR2-GAM-01…06 |
| C-18 Enterprise Security | FR2-IAM, FR2-AUTH, FR2-SEC |
| C-19 Audit Timeline | FR2-AUD-01…04, FR2-CMP-01…06 |
| C-20 Advanced Search | FR2-SRC-01…06 |
| C-21 Collaboration | FR2-COL-01…05 |
| C-22 Attachments | FR2-ATT-01…05 |
| C-23 Mobile / PWA | FR2-MOB-01…04 |
| C-24 Multi-Department | FR2-ORG-01…05 |
| C-25 AI Executive Insights | FR2-EXI-01…06 |

---

**Document Status:** DRAFT. This FRD is subject to review and approval by the Business Owner,
Innovation Committee, IT Project Manager, Solution Architect, Finance/FP&A, and QA Lead before
being baselined. All changes post-baseline must follow the formal Change Request process and
require updated approval sign-off.

**Relationship note:** This document does not supersede `IdeaHub_Ideathon_FRD.md` v1.0. Where
the two conflict on an implemented feature, v1.0 governs until a change request is approved.
