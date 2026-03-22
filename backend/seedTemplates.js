import 'dotenv/config';
import { SyllabusTemplate, connectDB } from './lib/db.js';
import { getDefaultSyllabus, getPMSRoadmap } from './lib/defaultSyllabus.js';
import mongoose from 'mongoose';

async function seed() {
  await connectDB();

  const templates = [
    {
      roleKey: 'upsc',
      data: getDefaultSyllabus(),
      metadata: {
        logo: 'UPSC Tracker',
        syllabusLabel: 'Syllabus',
        paperLabel: 'GS Paper',
        subjectLabel: 'Subject',
        chapterLabel: 'Chapter',
      }
    },
    {
      roleKey: 'pm',
      data: getPMSRoadmap(),
      metadata: {
        logo: 'Career Tracker',
        syllabusLabel: 'Roadmap',
        paperLabel: 'Category',
        subjectLabel: 'Main Topic',
        chapterLabel: 'Sub Topic',
      }
    }
  ];

  for (const t of templates) {
    await SyllabusTemplate.findOneAndUpdate(
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
