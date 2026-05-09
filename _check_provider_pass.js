const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function checkProviders() {
  await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const ServiceProvider = require('./models/serviceProviderModel');
  
  const provider = await ServiceProvider.findOne({ email: 'rahull.provider@example.com' }).select('+password').lean();
  console.log('Provider password field:', provider?.password);
  console.log('Provider keys:', Object.keys(provider || {}));
  
  const allProviders = await ServiceProvider.find({}).select('+password email firstName').limit(5).lean();
  allProviders.forEach(p => {
    console.log(p.firstName, p.email, 'has password:', !!p.password);
  });
  
  await mongoose.disconnect();
}
checkProviders().catch(err => { console.error(err.message); process.exit(1); });
