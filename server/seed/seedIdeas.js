/**
 * server/seed/seedIdeas.js
 * Seeds realistic dummy ideas for testing the dashboard.
 */
const Idea = require('../models/Idea');
const User = require('../models/User');
const Category = require('../models/Category');
const logger = require('../utils/logger');
const { IDEA_STATUS, BENEFIT_TYPE } = require('../../shared/constants');

const seedIdeas = async () => {
  logger.info('Seeding ideas...');

  // Fetch some seeded users
  const employee = await User.findOne({ email: 'employee@ideahub.local' });
  const supervisor = await User.findOne({ email: 'supervisor@ideahub.local' });
  const deptTeam = await User.findOne({ email: 'dept.team@ideahub.local' });

  if (!employee || !supervisor || !deptTeam) {
    logger.warn('Seed users not found. Please run seedUsers first.');
    return;
  }

  // Fetch a valid category to use
  const categoryDoc = await Category.findOne({});
  const categoryName = categoryDoc ? categoryDoc.name : 'Process Improvement';

  const dummyIdeas = [
    {
      title: 'Automate weekly operations reporting using Python scripts',
      category: categoryName,
      department: employee.department,
      problemStatement: 'Currently, the operations team spends over 15 hours every week manually compiling data from multiple sources into a single Excel report. This is prone to human error and delays critical decision-making by upper management.',
      proposedSolution: 'Develop a Python script to automatically fetch data from our internal APIs, process it using Pandas, and generate the weekly report automatically.',
      benefitTypes: [BENEFIT_TYPE.TIME_SAVINGS, BENEFIT_TYPE.PROCESS_EFFICIENCY],
      submittedBy: employee._id,
      supervisorId: supervisor._id,
      status: IDEA_STATUS.SUBMITTED,
      statusHistory: [
        {
          status: IDEA_STATUS.DRAFT,
          actor: employee._id,
          comment: 'Initial draft',
        },
        {
          status: IDEA_STATUS.SUBMITTED,
          actor: employee._id,
          comment: 'Submitting for supervisor approval',
        },
      ],
    },
    {
      title: 'Transition internal portal to AWS Serverless Architecture',
      category: categoryName,
      department: supervisor.department,
      problemStatement: 'Our current on-premise servers for the internal employee portal cost a significant amount of money to maintain and lack automatic scaling during peak traffic times, causing downtime.',
      proposedSolution: 'Migrate the portal backend to AWS Lambda and API Gateway, which scales infinitely and costs almost nothing when idle.',
      benefitTypes: [BENEFIT_TYPE.FINANCIAL_SAVINGS],
      submittedBy: supervisor._id,
      supervisorId: deptTeam._id,
      status: IDEA_STATUS.APPROVED_FOR_IMPLEMENTATION,
      statusHistory: [
        {
          status: IDEA_STATUS.SUBMITTED,
          actor: supervisor._id,
        },
        {
          status: IDEA_STATUS.APPROVED_FOR_IMPLEMENTATION,
          actor: deptTeam._id,
          comment: 'Great idea, approved for implementation.',
        }
      ],
    },
    {
      title: 'Digital ID Card integration in Mobile App',
      category: categoryName,
      department: employee.department,
      problemStatement: 'Employees frequently lose their physical ID cards, resulting in a continuous printing cost and security risk. The replacement process takes over 3 days.',
      proposedSolution: 'Add a secure digital ID card feature to the existing employee mobile app using encrypted QR codes.',
      benefitTypes: [BENEFIT_TYPE.FINANCIAL_SAVINGS, BENEFIT_TYPE.OTHER],
      submittedBy: employee._id,
      status: IDEA_STATUS.DRAFT,
      statusHistory: [
        {
          status: IDEA_STATUS.DRAFT,
          actor: employee._id,
          comment: 'Drafting new idea',
        }
      ],
    }
  ];

  let created = 0;
  for (const ideaData of dummyIdeas) {
    const existing = await Idea.findOne({ title: ideaData.title });
    if (!existing) {
      await Idea.create(ideaData);
      created++;
    }
  }

  logger.info(`Ideas seeded: ${created} created.`);
};

module.exports = seedIdeas;
