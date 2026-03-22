import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { loadConfig } from '../config/index.js';

// --- AUTH ---
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  role: { type: String, default: 'upsc' }, // 'upsc' or 'pm'
}, { timestamps: true });

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model('User', userSchema);

// --- USER DATA MODELS ---

const baseSchema = {
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
};

export const Board = mongoose.model('Board', new mongoose.Schema({
  ...baseSchema,
  name: String,
  data: mongoose.Schema.Types.Mixed,
}, { timestamps: true }));

export const DailyHour = mongoose.model('DailyHour', new mongoose.Schema({
  ...baseSchema,
  date: { type: String, required: true },
  hours: { type: Number, default: 0 },
}, { timestamps: true }));

export const Link = mongoose.model('Link', new mongoose.Schema({
  ...baseSchema,
  title: String,
  url: String,
  category: String,
  data: mongoose.Schema.Types.Mixed,
}, { timestamps: true }));

export const Record = mongoose.model('Record', new mongoose.Schema({
  ...baseSchema,
  type: String, // 'test', 'mistake', etc.
  content: mongoose.Schema.Types.Mixed,
}, { timestamps: true }));

export const StudySession = mongoose.model('StudySession', new mongoose.Schema({
  ...baseSchema,
  date: String,
  startTime: String,
  endTime: String,
  durationSeconds: Number,
  wastedSeconds: Number,
  pauses: Array,
  note: String,
  breakCount: { type: Number, default: 0 },
  maxContinuousSitting: { type: Number, default: 0 },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true }));

export const Syllabus = mongoose.model('Syllabus', new mongoose.Schema({
  ...baseSchema,
  data: mongoose.Schema.Types.Mixed,
}, { timestamps: true }));

export const Todo = mongoose.model('Todo', new mongoose.Schema({
  ...baseSchema,
  text: { type: String, required: true },
  done: { type: Boolean, default: false },
}, { timestamps: true }));

export const Topic = mongoose.model('Topic', new mongoose.Schema({
  ...baseSchema,
  name: String,
  status: String,
  data: mongoose.Schema.Types.Mixed,
}, { timestamps: true }));

export const Routine = mongoose.model('Routine', new mongoose.Schema({
  ...baseSchema,
  data: mongoose.Schema.Types.Mixed, // The routine structure (blocks, rules, etc.)
}, { timestamps: true }));

export const Note = mongoose.model('Note', new mongoose.Schema({
  ...baseSchema,
  gsPaper: String,
  subject: String,
  chapter: String,
  topic: String,
  filename: String,
  s3Key: String,
  contentType: String,
  size: Number,
}, { timestamps: true }));

// --- DYNAMIC ROLES & TEMPLATES ---
const roleTemplateSchema = new mongoose.Schema({
  roleKey: { type: String, required: true, unique: true }, // e.g., 'upsc', 'pm', 'neet'
  syllabus: { type: mongoose.Schema.Types.Mixed, required: true }, // The roadmap structure
  routine: { type: mongoose.Schema.Types.Mixed, required: true }, // The default routine
  labels: {
    logo: { type: String, default: 'Tracker' },
    moduleSyllabus: { type: String, default: 'Syllabus' },
    moduleRoutine: { type: String, default: 'Routine' },
    moduleRecords: { type: String, default: 'Records' },
    moduleNotes: { type: String, default: 'Notes' },
    moduleLinks: { type: String, default: 'Links' },
    moduleWhiteboards: { type: String, default: 'Whiteboards' },
    
    // Module-specific labels
    paper: { type: String, default: 'Paper' }, // e.g. GS Paper vs Category
    subject: { type: String, default: 'Subject' }, // e.g. Subject vs Main Topic
    chapter: { type: String, default: 'Chapter' }, // e.g. Chapter vs Sub Topic
    topic: { type: String, default: 'Topic' },
    
    // Records-specific
    recordTypeTest: { type: String, default: 'Test' }, // e.g. Test vs Project
    recordTypeMistake: { type: String, default: 'Mistake' }, // e.g. Mistake vs Learning
    recordScore: { type: String, default: 'Marks' }, // e.g. Marks vs Metric
    recordMax: { type: String, default: 'Max Marks' }, // e.g. Max Marks vs Target
  }
}, { timestamps: true });

export const RoleTemplate = mongoose.model('RoleTemplate', roleTemplateSchema);

// --- LOGS ---
const logSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  level: { type: String, default: 'info' },
  message: String,
  stack: String,
  path: String,
  method: String,
  timestamp: { type: Date, default: Date.now },
});

export const Log = mongoose.model('Log', logSchema);

// --- OLD GENERIC STORE (For migration purposes) ---
const storeSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true });
export const Store = mongoose.model('Store', storeSchema);

export async function connectDB(uri) {
  try {
    const config = await loadConfig();
    const finalUri = uri || config.mongoUri;
    await mongoose.connect(finalUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
}

export async function logEvent(level, message, extra = {}) {
  try {
    await Log.create({ level, message, ...extra });
  } catch (err) {
    console.error('Failed to save log to DB:', err.message);
  }
}
