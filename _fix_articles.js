const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function fixArticles() {
  await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  
  const db = mongoose.connection.db;
  const collection = db.collection('articles');
  
  const cursor = collection.find({ $expr: { $eq: [{ $type: '$content' }, 'string'] } });
  const corrupted = await cursor.toArray();
  
  console.log('Found ' + corrupted.length + ' corrupted articles');
  
  for (const doc of corrupted) {
    const oldContent = doc.content;
    // Replace the entire content field (not a subfield)
    await collection.updateOne(
      { _id: doc._id },
      { $set: { content: { text: oldContent || '', images: [], video: {} } } }
    );
    console.log('Fixed article ' + doc._id + ': content was "' + oldContent + '"');
  }
  
  console.log('Cleanup complete');
  await mongoose.disconnect();
}
fixArticles().catch(err => { console.error(err.message); process.exit(1); });
