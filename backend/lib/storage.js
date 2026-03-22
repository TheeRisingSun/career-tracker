import { Store } from './db.js';

export async function readData(name, defaultValue = null) {
  try {
    const record = await Store.findOne({ key: name });
    if (record) {
      return record.data;
    }
  } catch (e) {
    console.warn(`Read failed for ${name} from MongoDB:`, e.message);
  }
  return defaultValue;
}

export async function writeData(name, data) {
  try {
    await Store.findOneAndUpdate(
      { key: name },
      { data },
      { upsert: true, new: true }
    );
    return data;
  } catch (e) {
    console.error(`Write failed for ${name} to MongoDB:`, e.message);
    throw e;
  }
}
