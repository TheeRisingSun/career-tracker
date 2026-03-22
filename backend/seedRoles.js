import 'dotenv/config';
import { RoleTemplate, connectDB } from './lib/db.js';
import { getDefaultSyllabus, getPMSRoadmap } from './lib/defaultSyllabus.js';
import mongoose from 'mongoose';

const defaultUPSC_Routine = {
  tagline: 'Sustainable, not heroic — built for a 9 AM–7 PM job.',
  summary: [
    { type: 'Weekdays (Mon–Fri × 5)', hours: '21–22 hrs' },
    { type: 'Saturday', hours: '~10 hrs' },
    { type: 'Sunday', hours: '~8 hrs' },
    { type: 'Weekly total', hours: '~39–40 hrs', isTotal: true }
  ],
  days: [
    {
      title: '🗓️ Weekday (Mon–Fri)',
      totalLabel: '✅ ~4.25 hrs/day (morning 2.25 + night 2)',
      blocks: [
        { time: '5:30 – 7:45 AM', duration: '2 hr 15 min', label: 'Morning block — high focus', rotate: 'Sociology vs GS Static', points: ['Read core source', 'Make micro-notes', '1 answer'] },
        { time: '9:00 AM – 7:00 PM', label: 'Job time', points: ['Micro-use: editorials 15–20 min'] },
        { time: '8:30 – 10:30 PM', duration: '2 hrs', label: 'Night block — light + output', points: ['Current affairs OR revision', '1 hr answer writing'] },
        { time: '10:30 – 11:00 PM', label: 'Wind down', points: ['Revise', 'Plan next day', 'Sleep guilt‑free'] }
      ]
    }
  ],
  rotation: [
    { label: 'Weekday mornings', value: 'Sociology vs GS' },
    { label: 'Saturday', value: 'Creation + tests' },
    { label: 'Sunday', value: 'Revision + integration' }
  ],
  rules: ['Morning study > night study', '1 answer/day beats 10 on Sunday', 'Sleep ≥ 6.5 hrs']
};

const defaultPM_Routine = {
  tagline: 'Balanced execution — mastering product management.',
  summary: [
    { type: 'Daily Deep Work', hours: '2 hrs' },
    { type: 'Weekly Learning', hours: '10 hrs' },
    { type: 'Case Studies', hours: '3 hrs' },
    { type: 'Weekly total', hours: '~25 hrs', isTotal: true }
  ],
  days: [
    {
      title: '💼 Working Professional PM',
      totalLabel: '✅ ~3 hrs/day of dedicated growth',
      blocks: [
        { time: '7:00 – 8:30 AM', duration: '1.5 hrs', label: 'Strategy & Roadmap block', points: ['Review product vision', 'Competitor analysis', 'User research synthesis'] },
        { time: '9:00 AM – 6:00 PM', label: 'Core Work hours', points: ['Standups', 'Stakeholder management', 'PRD grooming'] },
        { time: '7:30 – 9:00 PM', duration: '1.5 hrs', label: 'Technical & Data skills', points: ['Analytics review', 'SQL practice', 'New tool exploration'] }
      ]
    }
  ],
  rotation: [
    { label: 'Mon/Wed/Fri', value: 'Product Discovery' },
    { label: 'Tue/Thu', value: 'Execution & Metrics' },
    { label: 'Weekend', value: 'Networking & Side Projects' }
  ],
  rules: ['Data over intuition', 'Customer feedback is king', 'Iterate fast, fail early']
};

async function seed() {
  await connectDB();

  const templates = [
    {
      roleKey: 'upsc',
      syllabus: getDefaultSyllabus(),
      routine: defaultUPSC_Routine,
      labels: {
        logo: 'Career Tracker',
        moduleSyllabus: 'Syllabus',
        moduleRoutine: 'Routine',
        moduleRecords: 'Records',
        moduleNotes: 'Study Notes',
        moduleLinks: 'Links',
        moduleWhiteboards: 'Whiteboards',
        paper: 'GS Paper',
        subject: 'Subject',
        chapter: 'Chapter',
        topic: 'Topic',
        recordTypeTest: 'Test / Mock',
        recordTypeMistake: 'Mistake',
        recordScore: 'Marks',
        recordMax: 'Max Marks',
        roadmapS3Key: 'public/product-manager.pdf'
      }
    },
    {
      roleKey: 'pm',
      syllabus: getPMSRoadmap(),
      routine: defaultPM_Routine,
      labels: {
        logo: 'Career Tracker',
        moduleSyllabus: 'Roadmap',
        moduleRoutine: 'Work Routine',
        moduleRecords: 'Outcomes',
        moduleNotes: 'Work Notes',
        moduleLinks: 'Resources',
        moduleWhiteboards: 'Boards',
        paper: 'Category',
        subject: 'Main Topic',
        chapter: 'Sub Topic',
        topic: 'Specifics',
        recordTypeTest: 'Project / Sprint',
        recordTypeMistake: 'Learning / Mistake',
        recordScore: 'Score / Metric',
        recordMax: 'Target',
        roadmapS3Key: 'public/product-manager.pdf'
      }
    }
  ];

  for (const t of templates) {
    await RoleTemplate.findOneAndUpdate(
      { roleKey: t.roleKey },
      t,
      { upsert: true, new: true }
    );
    console.log(`Seeded/Updated template for role: ${t.roleKey}`);
  }

  console.log('Seeding complete!');
  mongoose.connection.close();
}

seed();
