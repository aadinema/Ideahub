# IdeaHub (Ideathon) Functional Requirement Document

**MPOnline Limited | CONFIDENTIAL**

**Project Name**: Ideation & Improvement-IdeaHub (Ideathon)
**Module**: Enterprise Ideation & Innovation Management
**Document Type**: Functional Requirement Document (FRD)
**Version**: 1.0
**Status**: DRAFT PENDING REVIEW
**Prepared By**: Nilesh Wadbude
**Date**: 09 June 2026

---

## Document Control & Revision History

### Document Information

| Attribute | Details |
| :--- | :--- |
| Project Name | IdeaHub (Ideathon) |
| Module Name | Enterprise Ideation & Innovation Management System |
| Document Type | Functional Requirement Document (FRD)-v1.0 |
| Prepared By | Nilesh Wadbude |
| Reviewed By | Deven Goratela, [Consultant-Subject Matter Expert] |
| Approved By | Gagan Soni, [CTO] |
| Document Status | Draft |
| Classification | CONFIDENTIAL-INTERNAL USE ONLY |
| Target Stakeholders | Employees, Supervisors, Dept. Heads, Innovation Committee, Management, IT |

### Revision History

| Version | Date | Author | Description of Change | Status |
| :--- | :--- | :--- | :--- | :--- |
| 1.0 | 09 Jun 2026 | Nilesh Wadbude | Initial draft based on Pre-Notes and stakeholder inputs | Draft |

### Approvals

| Role | Name | Signature | Date |
| :--- | :--- | :--- | :--- |
| Subject Matter Expert | Deven Goratela | | 09-06-2026 |
| IT Project Manager/CTO | Gagan Soni | | |
| Solution Architect | | | |
| QA Lead | | | |

---

## Table of Contents
1. Executive Summary
2. Business Vision & Objectives
3. System Overview
4. User Roles & Access Responsibilities
5. Innovation Lifecycle & Workflow
6. Detailed Functional Requirements
7. Ideathon Event Management
8. Evaluation Framework
9. Department Target Management
10. Reports & Analytics Module
11. Notification Framework
12. Administration Module
13. Integration Requirements
14. Non-Functional Requirements
15. Future Enhancements (Phase 2+)
16. Assumptions, Dependencies & Constraints
17. Glossary of Terms
18. Expected Business Outcomes

---

## 1. Executive Summary

IdeaHub is MPOnline Limited's enterprise-wide Innovation and Ideation Management Platform, purpose-built to cultivate a sustainable culture of innovation across all organizational levels. This Functional Requirement Document (FRD) defines the complete functional specification for the IdeaHub (Ideathon) module, serving as the authoritative reference for design, development, testing, and acceptance activities.

The platform enables employees to submit innovative ideas, process improvements, automation opportunities, business enhancement suggestions, cost optimization proposals, and technology innovations providing a structured end-to-end workflow from idea submission through implementation to measurable outcome realization.

The system enforces transparency, accountability, governance, and measurable business value through a well-defined evaluation and implementation framework. By institutionalizing innovation management, IdeaHub transforms employee creativity into tangible organizational outcomes.

### 1.1 Scope of This Document
This FRD covers all functional requirements for the IdeaHub (Ideathon) module including:
* Idea submission, lifecycle management, and tracking
* Ideathon (event-based ideation) management
* Multi-level review, evaluation, and approval workflows
* Publishing and innovation gallery management
* Implementation and benefit realization tracking
* Reporting, analytics, and notification framework
* User roles, access control, and administration
* Integration requirements and non-functional requirements

### 1.2 Out of Scope
The following items are explicitly excluded from this release:
* AI-based idea recommendation engine
* Gamification and rewards management engine
* Mobile native application (iOS / Android)
* Real-time social collaboration feed
* Direct ERP or HRMS integration (deferred to Phase 2)

---

## 2. Business Vision & Objectives

### 2.1 Vision Statement
"To establish a centralized innovation ecosystem that encourages employees to contribute ideas capable of improving organizational performance, enhancing employee experience, optimizing business processes, reducing costs, and driving sustainable innovation across MPOnline Limited."

### 2.2 Strategic Business Objectives

| Strategic Objective | Priority | Key Results Expected |
| :--- | :--- | :--- |
| Innovation Culture Development | P1 | Encourage cross-department innovation; measure Innovation Index quarterly |
| Process Improvement | P1 | Capture process optimization opportunities; improve operational efficiency |
| Cost Optimization | P1 | Identify and quantify cost reduction and elimination of redundant activities |
| Employee Engagement & Participation | P2 | Provide structured platform; track participation rates and achievements |
| Business Growth | P2 | Generate business opportunities through employee-led innovation |
| Innovation Governance | P2 | Standardize evaluation; ensure transparent decision-making at all levels |

---

## 3. System Overview

### 3.1 Platform Description
IdeaHub functions as a centralized Innovation Management Platform hosted within the MPOnline enterprise ecosystem. The platform follows a structured workflow that transforms raw employee ideas into implemented organizational improvements, with full traceability at every stage.

### 3.2 Core Functional Capabilities

| Capability | Description |
| :--- | :--- |
| Idea Creation & Submission | Employees submit structured ideas with rich details, business benefits, and attachments |
| Ideathon Participation | Event-based ideation campaigns with defined timelines and focused themes |
| Innovation Proposal Tracking | Real-time status visibility from submission to closure |
| Multi-Level Approval Workflow | Supervisor → Department → Innovation Committee review chain |
| Evaluation & Scoring Engine | Configurable weighted scoring across strategic dimensions |
| Publishing & Showcase | Organization-wide innovation gallery with success stories |
| Implementation Tracking | Milestone-based implementation management with owner accountability |
| Benefit Realization Monitoring | Quantification and tracking of financial and operational outcomes |
| Reporting & Analytics | Role-based reports covering participation, pipeline, and business impact |

---

## 4. User Roles & Access Responsibilities

The IdeaHub platform enforces Role-Based Access Control (RBAC). The following roles are defined with their associated responsibilities and system permissions.

| Role | Core Responsibilities | Key System Permissions |
| :--- | :--- | :--- |
| Employee / Associate | Submit ideas; participate in Ideathons; track own ideas; view published innovations | Create Idea, View Own Ideas, Join Events, View Published Gallery |
| Supervisor | Validate employee ideas; approve/reject/send back for clarification; monitor team pipeline | View Team Ideas, Approve/Reject/Return Idea, Team Reports |
| Department Innovation Team | Evaluate ideas; assign scores; shortlist; recommend for implementation | Evaluate, Score, Shortlist, Reject, Department Reports |
| Innovation Committee | Final evaluation; strategic assessment; approve for publication or implementation | Final Approve/Reject, Approve for Publishing, Approve for Implementation |
| Implementation Owner | Execute approved ideas; update milestones; record actual benefits | Update Implementation Status, Record Benefits, View Assignments |
| Administrator | Manage events, categories, workflows, users, roles; generate all reports | Full System Access, User Management, Configuration, All Reports |

---

## 5. Innovation Lifecycle & Workflow

Every idea submitted on the IdeaHub platform follows a predefined, gated lifecycle. Each stage has defined entry conditions, possible actions, and exit criteria. No idea may skip a stage without an authorized override by the Administrator.

### 5.1 Lifecycle Stages

| Stage | Stage Name | Responsible Role | Permitted Actions | SLA/Target TAT |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Idea Creation | Employee / Associate | Draft, Submit | Anytime |
| 2 | Supervisor Validation | Immediate Supervisor | Approve, Reject, Send Back for Clarification | 3 Business Days |
| 3 | Department Innovation Review | Dept. Innovation Team | Evaluate, Score, Shortlist, Reject | 5 Business Days |
| 4 | Innovation Committee Review | Innovation Committee | Approve for Publishing, Approve for Implementation, Reject | 7 Business Days |
| 5 | Published | System / Admin | Visible Org-Wide | Auto on Approval |
| 6 | Implementation | Implementation Owner | Update Progress, Record Milestones | Per Plan |
| 7 | Benefit Realization | Implementation Owner/Finance | Record Actual Benefits | Post-Completion |
| 8 | Outcome Tracking & Closure | Innovation Committee / Admin | Monitor, Close | Ongoing |

### 5.2 Idea Journey Status Trail
Every idea maintains a full audit trail of status transitions. The following status progression must be visible to the submitter and all reviewers at all times:
Submitted → Under Supervisor Review → Supervisor Approved / Returned / Rejected → Under Department Evaluation → Shortlisted / Rejected by Dept. → Under Committee Review → Approved for Publishing / Approved for Implementation / Rejected → Published → Implementation Initiated → Implementation In Progress → Implementation Completed → Benefits Recorded → Outcome Monitored → Closed

At every stage transition, the system must automatically generate a notification to the idea submitter and the relevant reviewers.

---

## 6. Detailed Functional Requirements

This section defines the detailed functional requirements organized by module. Each requirement is assigned a unique ID, priority, and acceptance criteria.

### FR-01: Home Dashboard
The home dashboard is the central landing page for all authenticated users. It must provide a real-time view of the organization's innovation health.

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR-01-01 | Display organization-wide innovation KPIs including: Ideathons Hosted (FY), Associates Who Shared Ideas (FY), Ideas Received (FY), Opportunities Tagged, Implemented Ideas, Benefits Realized, Active Participants, Department Participation Rate, Innovation Index | MUST HAVE | All 9 KPIs visible on dashboard; data refreshes within 5 minutes of any change |
| FR-01-02 | Display Featured Ideas section showcasing top-rated or recently approved ideas with preview card (title, category, submitter, status) | MUST HAVE | At least 3 featured ideas displayed; admin-configurable |
| FR-01-03 | Display Success Stories section with implemented idea outcomes | MUST HAVE | Success stories show quantified benefit achieved |
| FR-01-04 | Display Announcements section for innovation campaigns, deadlines, and updates | MUST HAVE | Announcements support rich text; admin-manageable |
| FR-01-05 | Provide Quick Action buttons: Submit Idea, View My Ideas, Track Idea Status, Join Ideathon | MUST HAVE | All 4 quick actions navigate to correct pages; visible without scrolling on desktop |
| FR-01-06 | Dashboard KPIs must be filterable by Financial Year, Department, and Ideathon Event | SHOULD HAVE | Filter dropdowns present; KPI values update on selection |

### FR-02: Idea Submission & Management

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR-02-01 | The idea submission form must capture: Idea Title, Idea Category, Idea Type, Department, Initiative, Keywords | MUST HAVE | All fields validated; mandatory fields enforce completion before submission |
| FR-02-02 | Idea Details section must include: Problem Statement, Current Challenges, Proposed Solution, Innovation Description, Expected Outcome all as rich-text fields | MUST HAVE | Rich-text editor available; minimum character count enforced for Problem Statement (50 chars) |
| FR-02-03 | Business Benefits section must allow selection of applicable benefit types: Cost Reduction, Time Savings, Automation, Customer Experience, Revenue Generation, Employee Satisfaction, Compliance Improvement, Process Optimization | MUST HAVE | Multi-select checkboxes; at least one benefit type required |
| FR-02-04 | Attachment support for Documents (PDF, DOCX, XLSX), Images (JPG, PNG), Presentations (PPTX), Videos (MP4), and Supporting Evidence with a maximum of 5 attachments, each up to 20 MB | MUST HAVE | File type and size validation enforced; attachments viewable inline |
| FR-02-05 | Auto-save draft functionality | MUST HAVE | idea is auto-saved every 2 minutes and on browser close; Draft recoverable on next login; draft indicator visible to user |
| FR-02-06 | Duplicate idea detection system warns user if similar idea exists (keyword/title match) | SHOULD HAVE | Warning shown with link to similar idea; user can proceed or cancel |
| FR-02-07 | Idea can be linked to an active Ideathon event during submission | MUST HAVE | Dropdown lists active events; idea tagged to selected event |
| FR-02-08 | Idea submitter receives email and in-app confirmation upon successful submission with assigned Idea ID | MUST HAVE | Notification sent within 1 minute; Idea ID visible in My Ideas |

### FR-03: Supervisor Validation Workflow

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR-03-01 | Supervisor receives notification when a direct reportee submits an idea requiring validation | MUST HAVE | Notification delivered within 5 minutes; includes idea title, category, and direct link |
| FR-03-02 | Supervisor can Approve, Reject, or Send Back for Clarification with mandatory comments for Reject and Send Back actions | MUST HAVE | Action buttons present; Reject and Send Back require minimum 20-character comment |
| FR-03-03 | On Send Back, idea returns to submitter with supervisor comments visible; submitter can revise and resubmit | MUST HAVE | Status shows 'Returned - Awaiting Revision'; resubmit count tracked |
| FR-03-04 | Supervisor dashboard shows pending validation queue with SLA countdown (3 business days) | MUST HAVE | Items approaching SLA highlighted in amber; breached in red |
| FR-03-05 | Supervisor can view all ideas in their team's pipeline regardless of stage | SHOULD HAVE | Filterable by status, category, date range |
| FR-03-06 | Escalation notification sent to Supervisor's manager if SLA is breached | SHOULD HAVE | Escalation email and in-app alert generated automatically on SLA breach |

### FR-04: Department Innovation Review

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR-04-01 | Department Innovation Team receives notification when supervisor-approved ideas are routed for evaluation | MUST HAVE | Notification includes idea summary; item appears in evaluation queue |
| FR-04-02 | Evaluators can score ideas against defined criteria using configured weighted scoring framework (see Section 8) | MUST HAVE | Scoring form reflects current active criteria configuration; auto-calculates weighted total |
| FR-04-03 | Multiple evaluators can independently score the same idea; system computes average score | SHOULD HAVE | Average displayed alongside individual scores; minimum 2 evaluator scores before Shortlisting |
| FR-04-04 | Evaluator can Shortlist, Reject, or escalate for additional information with mandatory comments | MUST HAVE | Status transitions recorded with timestamp and evaluator identity |
| FR-04-05 | Department evaluation dashboard shows pipeline by status with department-level target achievement metrics | MUST HAVE | Real-time counters; downloadable pipeline report |

### FR-05: Innovation Committee Review & Approval

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR-05-01 | Innovation Committee receives notification when ideas are shortlisted by Department team | MUST HAVE | Batch notification supported; individual idea links included |
| FR-05-02 | Committee can view full idea details, evaluation scores, evaluator comments, and idea journey history | MUST HAVE | 360-degree view of idea available on single screen |
| FR-05-03 | Committee actions: Approve for Publishing, Approve for Implementation (with Implementation Owner assignment), Reject, or Defer for Next Review Cycle | MUST HAVE | All four actions available; Implementation Owner lookup from employee directory |
| FR-05-04 | Committee can conduct voting each member records individual vote; system aggregates and shows consensus | SHOULD HAVE | Voting module shows vote distribution; quorum rules configurable by Admin |
| FR-05-05 | Committee decision along with rationale is recorded and visible to submitter and all previous reviewers | MUST HAVE | Rationale text mandatory; visible in idea history timeline |

### FR-06: Idea Publishing & Innovation Gallery

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR-06-01 | Approved ideas are automatically published to the Innovation Gallery; visible to all authenticated users | MUST HAVE | Published idea appears in gallery within 15 minutes of approval |
| FR-06-02 | Innovation Gallery displays: Published Ideas, Innovation Showcase (featured), Top Contributors leaderboard, Success Stories | MUST HAVE | Each section displays correctly; leaderboard auto-updates monthly |
| FR-06-03 | Gallery supports search by keyword, category, department, date range, and innovation type | MUST HAVE | Search returns results within 2 seconds; filters are combinable |
| FR-06-04 | Admin can unpublish or archive an idea from the gallery with justification | MUST HAVE | Unpublish action logged in audit trail; submitter notified |

### FR-07: Implementation Tracking

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR-07-01 | Implementation record must capture: Implementation Owner, Department, Start Date, Target Completion Date, Progress %, Key Milestones, Actual Benefits | MUST HAVE | All mandatory fields enforced; progress slider available (0-100%) |
| FR-07-02 | Implementation Owner can create and update milestones with target dates and completion status | MUST HAVE | Milestone timeline view available; overdue milestones highlighted |
| FR-07-03 | Automatic reminder sent to Implementation Owner 3 days before target completion date | MUST HAVE | Reminder configurable; email and in-app |
| FR-07-04 | Implementation progress visible to Innovation Committee and Admin at all times | MUST HAVE | Read-only view for Committee; edit restricted to Implementation Owner and Admin |
| FR-07-05 | On implementation completion, system prompts for Benefits Realization data entry | MUST HAVE | Benefits form shown as mandatory next step after marking 100% completion |

### FR-08: Benefit Realization & Outcome Tracking

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR-08-01 | Financial Benefits: record actual Cost Savings (INR) and Revenue Increase (INR) with supporting evidence upload | MUST HAVE | Numeric fields with INR currency; evidence attachment mandatory for amounts > INR 1 Lakh |
| FR-08-02 | Operational Benefits: record Efficiency Improvement (%) and Productivity Gain (%) with qualitative description | MUST HAVE | Percentage fields with validation (0-100); description field minimum 50 chars |
| FR-08-03 | Strategic Benefits: record Customer Satisfaction Score change and Innovation Impact rating (1-10) | SHOULD HAVE | Score and rating fields validated; NPS/CSAT integration noted for Phase 2 |
| FR-08-04 | Benefit data must be aggregated on the organization dashboard and in the Benefits Realization Report | MUST HAVE | Aggregated totals update within 1 hour of data entry |
| FR-08-05 | Innovation Committee can verify and endorse recorded benefits; disputes can be flagged for Finance review | SHOULD HAVE | Endorsement status shown on idea card; dispute workflow routes to Finance reviewer |

---

## 7. Ideathon Event Management

Ideathons are structured, time-bound innovation campaigns. The system must support end-to-end Ideathon lifecycle management.

### 7.1 Event Types Supported

| Event Type | Description | Applicable Category |
| :--- | :--- | :--- |
| Ideathon | Focused innovation challenge with defined problem statement | Technology & Innovation, Process Framework |
| Workshop | Facilitated group ideation sessions | Learning & Development, Leadership |
| Conference | Knowledge-sharing and innovation showcase events | Business & Professional, Corporate |
| Survey / Poll | Structured feedback and idea collection | All Categories |
| Training | Skill-building sessions linked to innovation themes | Personal Development, L&D |
| Celebration | Recognition events for top innovators | Appreciation & Felicitation |

### 7.2 Ideathon Functional Requirements

| Req ID | Requirement Description | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| FR-IE-01 | Admin can create Ideathon events with: Event Name, Theme, Description, Event Type, Initiative, Start Date, End Date, Target Department(s), Max Participants, Idea Category | MUST HAVE | All fields present; date validation prevents end date before start date |
| FR-IE-02 | Events can be published (visible to all), restricted (targeted departments), or draft (admin only) | MUST HAVE | Visibility control on event create/edit screen; restricted events only appear to target department users |
| FR-IE-03 | Employees can register/join an Ideathon from the My Events or Explore section | MUST HAVE | Join confirmation sent; participant count visible on event card |
| FR-IE-04 | Explore section allows browsing events by: Type, Initiative, and Business Category | MUST HAVE | Three filter dimensions with multi-select; results update dynamically |
| FR-IE-05 | Ideathon leaderboard shows top idea contributors ranked by evaluation score within the event | SHOULD HAVE | Leaderboard updates in real-time; visible to all participants after evaluation phase begins |
| FR-IE-06 | System automatically closes idea submission when Ideathon end date is reached | MUST HAVE | Submission form disabled post-deadline; banner shown to users attempting submission |
| FR-IE-07 | Admin can extend Ideathon deadline with mandatory justification; change logged in audit trail | MUST HAVE | Extension notification sent to all registered participants |

---

## 8. Evaluation Framework

The IdeaHub evaluation engine uses a configurable, weighted multi-criteria scoring mechanism. The framework ensures objective, transparent, and consistent assessment of all ideas.

### 8.1 Evaluation Criteria

| # | Evaluation Criterion | Default Weight | Score Range | Scoring Guidance |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Innovation Score | 15% | 1-10 | Degree of novelty and originality |
| 2 | Feasibility | 15% | 1-10 | Technical and operational practicality |
| 3 | Strategic Alignment | 20% | 1-10 | Alignment with organizational strategy |
| 4 | Business Impact | 15% | 1-10 | Potential magnitude of positive impact |
| 5 | Cost Saving Potential | 10% | 1-10 | Estimated financial benefit |
| 6 | Revenue Opportunity | 10% | 1-10 | Potential revenue generation |
| 7 | Customer Benefit | 5% | 1-10 | Enhancement to customer experience |
| 8 | Implementation Complexity | 5% | 1-10 | 10 = very simple; 1 = highly complex |
| 9 | Risk Assessment | 5% | 1-10 | 10 = low risk; 1 = high risk |

**Weighted Score Formula:** Total Score = Sum of (Individual Criterion Score × Criterion Weight)
*Note: Default weights total 100%. Administrators can reconfigure weights per Ideathon event. Minimum qualifying score for Shortlisting: configurable by Admin (default = 6.0/10.0)*

### 8.2 Scoring Configuration Requirements
* Administrators can add, edit, deactivate, or reorder evaluation criteria
* Weights must always sum to 100%; system validates and prevents save if total ≠ 100%
* Criteria configuration changes must be versioned; historical evaluations retain the criteria set active at time of scoring
* Minimum and maximum qualifying score thresholds must be configurable per Ideathon
* Score history per evaluator per idea must be retained for audit purposes

---

## 9. Department Target Management

The system must support assignment of quantitative idea submission targets to departments for each financial year and Ideathon event, with real-time achievement tracking.

### 9.1 Target Configuration
* Administrators can assign annual and per-Ideathon idea submission targets at department level
* Targets can be set as total ideas, approved ideas, or implemented ideas
* Targets are visible to Department Heads and Innovation Committee on their dashboards

### 9.2 Target Tracking Display

| Department | Annual Target | Ideas Submitted | Ideas Approved | Achievement % | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Information Technology | 100 | | | | On Track |
| Human Resources | 50 | | | | On Track |
| Finance & Accounts | 40 | | | | On Track |
| Operations | 75 | | | | On Track |

*Note: The table above is illustrative. Actual data will populate dynamically from the system at runtime.*

---

## 10. Reports & Analytics Module

All reports are role-based and accessible only to users with the appropriate permission. Reports must support export to Excel (.xlsx) and PDF formats with configurable date range filters.

| Report Category | Report Name | Description / Key Metrics | Access Role |
| :--- | :--- | :--- | :--- |
| Associate Reports | My Submitted Ideas | Full list of own ideas with status, category, event, and current stage | Employee |
| Associate Reports | My Idea Journey | Timeline view of each idea's stage progression with timestamps | Employee |
| Associate Reports | My Implementations | Ideas where employee is assigned as Implementation Owner | Employee |
| Supervisor Reports | Team Ideas Pipeline | All ideas from direct reportees; filterable by status and date | Supervisor |
| Supervisor Reports | Pending Approvals | Ideas awaiting supervisor action with SLA countdown | Supervisor |
| Supervisor Reports | Team Participation Rate | % of team who submitted at least one idea in selected period | Supervisor |
| Department Reports | Dept. Innovation Performance | Ideas submitted, evaluated, approved, implemented, and benefits realized by department | Dept. Head |
| Department Reports | Dept. Target Achievement | Target vs. actual ideas submitted and approved; % achievement | Dept. Head |
| Department Reports | Idea Conversion Ratio | Submitted → Approved → Implemented funnel with drop-off rates | Dept. Head |
| Management Reports | Org. Innovation Dashboard | Organization-wide innovation KPIs with trend charts (monthly/quarterly/annual) | Management |
| Management Reports | Cost Savings Report | Aggregated financial benefits with department breakdown and YTD totals | Management |
| Management Reports | Benefits Realization Report | Realized vs. projected benefits across financial, operational, and strategic dimensions | Management |
| Management Reports | Innovation Trend Analysis | Submission trends, category distribution, top departments, seasonal patterns | Management |
| Management Reports | Top Performing Departments | Ranking by idea count, approval rate, implementation rate, and benefits realized | Management |
| Admin Reports | Audit Log Report | Complete system activity log with user, action, timestamp, and entity reference | Admin |
| Admin Reports | User Participation Report | All users' participation activity across all events and idea submissions | Admin |

---

## 11. Notification Framework

The notification framework ensures all relevant stakeholders are kept informed at every stage of the innovation lifecycle. Notifications must be configurable at both system level (Admin) and individual level (user preferences).

| Trigger Event | Recipient(s) | Email | In-App | Dashboard Alert |
| :--- | :--- | :--- | :--- | :--- |
| Idea successfully submitted | Submitter | Yes | Yes | No |
| Idea assigned for Supervisor review | Supervisor | Yes | Yes | Yes |
| Idea approved by Supervisor | Submitter | Yes | Yes | No |
| Idea returned for clarification | Submitter | Yes | Yes | Yes |
| Idea rejected | Submitter | Yes | Yes | No |
| Idea routed to Dept. Evaluation | Dept. Innovation Team | Yes | Yes | Yes |
| Idea shortlisted by Dept. Team | Submitter, Committee | Yes | Yes | No |
| Idea approved by Committee | Submitter, Dept. Head | Yes | Yes | No |
| Idea published to Gallery | Submitter, Org-Wide | Yes | Yes | No |
| Implementation assigned | Impl. Owner, Submitter | Yes | Yes | Yes |
| Implementation milestone overdue | Impl. Owner, Supervisor | Yes | Yes | Yes |
| Implementation completed | Submitter, Committee | Yes | Yes | No |
| Supervisor SLA breach (3 days) | Supervisor, Manager | Yes | Yes | Yes |
| New Ideathon event launched | All eligible users | Yes | Yes | No |
| Ideathon closing in 48 hours | All registered participants | Yes | Yes | Yes |

---

## 12. Administration Module

The Administration module provides centralized control for system configuration, user management, workflow governance, and master data management.

### 12.1 Admin Functional Requirements

| Req ID | Area | Requirement | Priority |
| :--- | :--- | :--- | :--- |
| FR-AD-01 | User Management | Create, edit, deactivate user accounts; assign and revoke roles; bulk import via CSV | MUST HAVE |
| FR-AD-02 | Role Configuration | Define and manage roles and associated permissions; assign default role per designation or grade | MUST HAVE |
| FR-AD-03 | Event Management | Create, publish, extend, and close Ideathon events; manage event categories and initiatives | MUST HAVE |
| FR-AD-04 | Category Management | Add, edit, deactivate idea categories and sub-categories; manage innovation types | MUST HAVE |
| FR-AD-05 | Workflow Configuration | Configure SLA timelines, escalation rules, approval chain, and notification triggers per event type | MUST HAVE |
| FR-AD-06 | Evaluation Config. | Configure scoring criteria, weights, and qualifying thresholds per Ideathon or globally | MUST HAVE |
| FR-AD-07 | Department Target Setup | Set and modify department-level targets by financial year and Ideathon event | MUST HAVE |
| FR-AD-08 | Announcement Management | Create and schedule announcements on the home dashboard; set expiry date | SHOULD HAVE |
| FR-AD-09 | Audit Log Viewer | View and export full system audit trail with filtering by user, action type, date range, and entity | MUST HAVE |
| FR-AD-10 | Master Data Management | Manage departments, designations, grades, initiatives, and integration mappings | MUST HAVE |

---

## 13. Integration Requirements

The following integration requirements define the external system touchpoints for IdeaHub. Phase 1 integrations are mandatory for go-live; Phase 2 integrations are deferred.

| System | Integration Purpose | Data Exchanged | Phase | Priority |
| :--- | :--- | :--- | :--- | :--- |
| Active Directory / SSO | Single Sign-On authentication; user provisioning | User ID, Name, Email, Designation, Department, Manager | 1 | P1 |
| Employee Directory / HRMS | Employee master data synchronization | Employee profile, department, grade, reporting structure | 1 | P1 |
| Email System (SMTP/Exchange) | Notification and alert delivery | Notification content, recipient list | 1 | P1 |
| ERP System | Cost savings validation and financial benefit recording | GL codes, cost center, financial data | 2 | P2 |
| Microsoft Teams / Collaboration | Push notifications to collaboration platform channels | Notification messages, links | 2 | P2 |
| Analytics Platform (BI) | Export data for advanced analytics and executive dashboards | Aggregated idea and benefit datasets | 2 | P2 |

---

## 14. Non-Functional Requirements

The following non-functional requirements define the quality attributes, performance benchmarks, and operational standards the IdeaHub platform must comply with.

| NFR Category | Attribute | Requirement Specification | Priority |
| :--- | :--- | :--- | :--- |
| Performance | Page Load Time | All pages must load within 3 seconds under normal load conditions | MUST HAVE |
| Performance | Search Response | Search and filter results must return within 2 seconds | MUST HAVE |
| Performance | Concurrent Users | System must support a minimum of 500 concurrent active users without degradation | MUST HAVE |
| Availability | System Uptime | 99.9% uptime SLA; scheduled maintenance windows notified 48 hours in advance | MUST HAVE |
| Availability | Disaster Recovery | RTO ≤ 4 hours; RPO ≤ 1 hour for all idea and implementation data | MUST HAVE |
| Security | Access Control | Role-Based Access Control (RBAC) enforced at all UI and API levels | MUST HAVE |
| Security | Data Encryption | All data encrypted in transit (TLS 1.2+) and at rest (AES-256) | MUST HAVE |
| Security | Session Management | Session timeout after 30 minutes of inactivity; secure cookie handling | MUST HAVE |
| Scalability | User Growth | Architecture must support horizontal scaling to accommodate 10x user growth without redesign | MUST HAVE |
| Scalability | Data Volume | System must handle 100,000+ ideas and 5+ years of data without performance degradation | SHOULD HAVE |
| Audit & Compliance | Audit Trail | Complete immutable audit log for all create, update, delete, and approval actions | MUST HAVE |
| Audit & Compliance | Data Retention | Idea data retained for minimum 7 years per organizational records policy | MUST HAVE |
| Usability | Accessibility | UI must comply with WCAG 2.1 Level AA accessibility standards | SHOULD HAVE |
| Usability | Browser Support | Fully functional on Chrome (latest 2 versions), Edge, Firefox, and Safari | MUST HAVE |
| Usability | Responsive Design | UI must be responsive and usable on desktop, tablet, and mobile browsers | MUST HAVE |

---

## 15. Future Enhancements (Phase 2+)

The following capabilities are acknowledged by stakeholders as desirable enhancements but are explicitly deferred from the current release scope. They should be architected for in the platform design to avoid costly rework.

| # | Enhancement | Description | Target Phase |
| :--- | :--- | :--- | :--- |
| 1 | AI-Based Idea Recommendation | Suggest relevant Ideathon events and similar ideas to employees based on submission history and profile | Phase 2 |
| 2 | Duplicate Idea Detection (AI) | Semantic similarity detection to flag near-duplicate ideas before submission | Phase 2 |
| 3 | Gamification Engine | Points, badges, and achievement levels for idea submission, evaluation, and implementation milestones | Phase 2 |
| 4 | Reward & Recognition Management | Monetary and non-monetary reward redemption integrated with HR recognition programs | Phase 2 |
| 5 | Innovation Leaderboard | Public leaderboard ranking top innovators by points, implemented ideas, and realized benefits | Phase 2 |
| 6 | Social Collaboration Feed | Like, comment, and share functionality on published ideas; follow innovators | Phase 2 |
| 7 | Native Mobile Application | iOS and Android applications with push notifications and offline draft capability | Phase 3 |
| 8 | Advanced Analytics Dashboard | Self-service BI dashboards with drill-down, export, and trend forecasting capabilities | Phase 2 |
| 9 | Knowledge Repository | Searchable repository of lessons learned, innovation case studies, and methodology guides | Phase 3 |
| 10 | ERP/Finance Integration | Direct validation of cost savings claims against ERP general ledger and cost center data | Phase 2 |

---

## 16. Assumptions, Dependencies & Constraints

### 16.1 Assumptions
* All users will be authenticated via the organization's Active Directory / SSO prior to accessing IdeaHub
* Employee master data including department hierarchy and reporting relationships will be available via HRMS API or a synchronized data feed
* The organization will designate an Innovation Committee with defined membership and quorum rules prior to system go-live
* Department Innovation Teams will be formally identified and enrolled in the system by the Administrator before Ideathon events are launched
* Email infrastructure (SMTP relay or Exchange) will be available and configured for notification delivery
* Business benefit values (cost savings, revenue increase) provided by Implementation Owners will be taken on good faith; Finance verification is a Phase 2 capability

### 16.2 Dependencies
* Successful integration with Active Directory / SSO is a go-live prerequisite
* HRMS employee data feed must be available and tested before User Acceptance Testing (UAT)
* Evaluation criteria and scoring weights must be finalized by the Innovation Committee before the evaluation module can be configured
* Department targets must be agreed upon by management before the target tracking module can be activated

### 16.3 Constraints
* The platform must be deployed within the existing infrastructure environment (on-premise or approved cloud)
* Data residency requirements: all data must remain within India in compliance with applicable data protection regulations
* The system must not store personally identifiable information beyond what is required for the ideation workflow
* Phase 1 delivery timeline as agreed in the project charter; any scope additions require formal change request

---

## 17. Glossary of Terms

| Term / Abbreviation | Definition |
| :--- | :--- |
| FRD | Functional Requirement Document - a formal specification of the functions a system must perform |
| IdeaHub | MPOnline's enterprise Innovation and Ideation Management Platform |
| Ideathon | A structured, time-bound innovation campaign or event inviting employees to submit ideas on a specific theme |
| RBAC | Role-Based Access Control - a method of restricting system access based on user roles |
| KPI | Key Performance Indicator - a quantifiable measure used to evaluate the success of an objective |
| SLA | Service Level Agreement - a commitment to respond or act within a defined timeframe |
| TAT | Turnaround Time - the total time taken to complete a process from initiation to completion |
| Benefit Realization | The process of measuring and documenting the actual business benefits achieved after an idea is implemented |
| Innovation Index | A composite organizational metric measuring innovation health, participation, and outcome |
| RTO | Recovery Time Objective - the maximum acceptable downtime in a disaster recovery scenario |
| RPO | Recovery Point Objective - the maximum acceptable data loss measured in time |
| SSO | Single Sign-On - an authentication service allowing one set of credentials to access multiple applications |
| WCAG | Web Content Accessibility Guidelines - international standards for making web content accessible |
| UAT | User Acceptance Testing - formal testing conducted by end users to verify the system meets business requirements |

---

## 18. Expected Business Outcomes

Successful deployment and adoption of the IdeaHub platform is expected to deliver the following measurable business outcomes:

| # | Expected Outcome | Measurement Metric | Target (Year 1) |
| :--- | :--- | :--- | :--- |
| 1 | Increased Employee Participation in Innovation | % of employees submitting at least 1 idea per year | ≥ 40% participation rate |
| 2 | Improved Process Efficiency | Average process improvement % from implemented ideas | Measurable improvement in 25 processes |
| 3 | Higher Innovation Index | Composite Innovation Index score (tracked quarterly) | 20% YoY improvement |
| 4 | Reduced Operational Costs | Total documented cost savings from implemented ideas (INR) | INR 50 Lakhs+ in Year 1 |
| 5 | Better Cross-Department Collaboration | Number of ideas with cross-departmental evaluation or implementation | 10% of approved ideas |
| 6 | Measurable Business Benefits | Total realized benefits across financial, operational, and strategic dimensions | Benefits Realized Report published quarterly |
| 7 | Continuous Improvement Culture | Year-over-year growth in idea submissions and implementation rate | ≥ 15% growth in idea submissions YoY |

**Document Status:** DRAFT - This FRD is subject to review and approval by the Business Owner, IT Project Manager, Solution Architect, and QA Lead before being baselined. All changes post-baseline must follow the formal Change Request process and require updated approval sign-off.
