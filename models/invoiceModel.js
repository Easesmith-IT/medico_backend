// const mongoose = require('mongoose');

// const invoiceSchema = new mongoose.Schema({
//   invoiceNumber: { type: String, required: true, unique: true },
//   bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
//   patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }, // Captured from booking
//     doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceProvider', required: false }, 
  
//   // Snapshot of the service at time of billing
//   billingDetails: {
//     category: { type: String, enum: ["consultation", "nursing", "equipment"] },
//     serviceName: String,
//     shiftType: String,       // e.g., '12-hour', '24-hour', 'hourly'
//     durationMinutes: Number, // Total minutes for hourly calculation
//     basePrice: Number,       // Unit price from Service model
//     calculatedBase: Number,  // Price after multipliers (e.g., 11x for 12-hour)
//     taxPercentage: { type: Number, default: 0 } // Healthcare services are often 0% [web:15]
//   },

//   medicines: [{
//     name: String,
//     quantity: { type: Number, default: 1 },
//     pricePerUnit: Number,
//     gstPercentage: { type: Number, default: 12 },
//     total: Number // (qty * price) + gst
//   }],

//   additionalEquipment: [{
//     name: String,
//     quantity: { type: Number, default: 1 },
//     rate: Number,
//     gstPercentage: { type: Number, default: 18 },
//     total: Number
//   }],

//   totals: {
//     subtotal: Number,   // Base amount before GST
//     gstAmount: Number,  // Total tax from all items
//     cgst: Number,       // 50% of gstAmount [web:21]
//     sgst: Number,       // 50% of gstAmount [web:21]
//     grandTotal: Number  // Final payable amount
//   },
  
//   paymentStatus: { type: String, enum: ['Paid', 'Unpaid', 'Partially Paid'], default: 'Unpaid' },
//   issuedAt: { type: Date, default: Date.now }
// }, { timestamps: true });
// // Add this logic before module.exports = mongoose.model('Invoice', invoiceSchema);

// invoiceSchema.pre('save', function (next) {
//   // 1. Calculate Billing Base (Consultation/Nursing)
//   const billingTotal = this.billingDetails.calculatedBase || 0;
//   const billingTax = (billingTotal * (this.billingDetails.taxPercentage || 0)) / 100;

//   // 2. Calculate Medicines Total
//   let medicineSubtotal = 0;
//   let medicineGst = 0;
//   this.medicines.forEach(med => {
//     const base = med.quantity * med.pricePerUnit;
//     const tax = (base * med.gstPercentage) / 100;
//     med.total = base + tax; // Individual item total
//     medicineSubtotal += base;
//     medicineGst += tax;
//   });

//   // 3. Calculate Manual Equipment Charges
//   let equipmentSubtotal = 0;
//   let equipmentGst = 0;
//   this.additionalEquipment.forEach(equip => {
//     const base = equip.quantity * equip.rate;
//     const tax = (base * equip.gstPercentage) / 100;
//     equip.total = base + tax; // Individual item total
//     equipmentSubtotal += base;
//     equipmentGst += tax;
//   });

//   // 4. Update Final Totals
//   this.totals.subtotal = billingTotal + medicineSubtotal + equipmentSubtotal;
//   this.totals.gstAmount = billingTax + medicineGst + equipmentGst;
//   this.totals.cgst = this.totals.gstAmount / 2; // Split 50-50 [web:21]
//   this.totals.sgst = this.totals.gstAmount / 2;
//   this.totals.grandTotal = this.totals.subtotal + this.totals.gstAmount;

//   next();
// });

// module.exports = mongoose.model('Invoice', invoiceSchema);



const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceProvider' }, 
  billingDetails: {
    category: { type: String, enum: ["consultation", "nursing", "equipment"] },
    serviceName: String,
    shiftType: String,
    durationMinutes: Number,
    basePrice: Number,
    calculatedBase: { type: Number, default: 0 },
    taxPercentage: { type: Number, default: 0 }
  },
  medicines: [{
    name: String,
    quantity: { type: Number, default: 1 },
    pricePerUnit: { type: Number, default: 0 },
    gstPercentage: { type: Number, default: 12 },
    total: { type: Number, default: 0 }
  }],
  additionalEquipment: [{
    name: String,
    quantity: { type: Number, default: 1 },
    rate: { type: Number, default: 0 },
    gstPercentage: { type: Number, default: 18 },
    total: { type: Number, default: 0 }
  }],
  totals: {
    subtotal: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 }
  },
  paymentStatus: { type: String, enum: ['Paid', 'Unpaid', 'Partially Paid'], default: 'Unpaid' },
  issuedAt: { type: Date, default: Date.now }
}, { timestamps: true });

invoiceSchema.pre('save', function (next) {
  const billingBase = parseFloat(this.billingDetails.calculatedBase) || 0;
  const billingTax = (billingBase * (parseFloat(this.billingDetails.taxPercentage) || 0)) / 100;

  let medSub = 0, medTax = 0;
  this.medicines.forEach(m => {
    const base = (m.quantity || 0) * (m.pricePerUnit || 0);
    const tax = (base * (m.gstPercentage || 0)) / 100;
    m.total = base + tax;
    medSub += base; medTax += tax;
  });

  let equipSub = 0, equipTax = 0;
  this.additionalEquipment.forEach(e => {
    const base = (e.quantity || 0) * (e.rate || 0);
    const tax = (base * (e.gstPercentage || 0)) / 100;
    e.total = base + tax;
    equipSub += base; equipTax += tax;
  });

  this.totals.subtotal = billingBase + medSub + equipSub;
  this.totals.gstAmount = billingTax + medTax + equipTax;
  this.totals.cgst = this.totals.gstAmount / 2;
  this.totals.sgst = this.totals.gstAmount / 2;
  this.totals.grandTotal = this.totals.subtotal + this.totals.gstAmount;
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
