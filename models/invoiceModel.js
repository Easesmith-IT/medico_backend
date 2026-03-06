



// const mongoose = require('mongoose');

// const invoiceSchema = new mongoose.Schema({
//   invoiceNumber: { type: String, required: true, unique: true },
//   bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
//   patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
//   doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceProvider' }, 
//   billingDetails: {
//     category: { type: String, enum: ["consultation", "nursing", "equipment"] },
//     serviceName: String,
//     shiftType: String,
//     durationMinutes: Number,
//     basePrice: Number,
//     calculatedBase: { type: Number, default: 0 },
//     taxPercentage: { type: Number, default: 0 }
//   },
//   medicines: [{
//     name: String,
//     quantity: { type: Number, default: 1 },
//     pricePerUnit: { type: Number, default: 0 },
//     gstPercentage: { type: Number, default: 12 },
//     total: { type: Number, default: 0 }
//   }],
//   additionalEquipment: [{
//     name: String,
//     quantity: { type: Number, default: 1 },
//     rate: { type: Number, default: 0 },
//     gstPercentage: { type: Number, default: 18 },
//     total: { type: Number, default: 0 }
//   }],
//   totals: {
//     subtotal: { type: Number, default: 0 },
//     gstAmount: { type: Number, default: 0 },
//     cgst: { type: Number, default: 0 },
//     sgst: { type: Number, default: 0 },
//     grandTotal: { type: Number, default: 0 }
//   },
//   paymentStatus: { type: String, enum: ['Paid', 'Unpaid', 'Partially Paid'], default: 'Unpaid' },
//   issuedAt: { type: Date, default: Date.now }
// }, { timestamps: true });

// invoiceSchema.pre('save', function (next) {
//   const billingBase = parseFloat(this.billingDetails.calculatedBase) || 0;
//   const billingTax = (billingBase * (parseFloat(this.billingDetails.taxPercentage) || 0)) / 100;

//   let medSub = 0, medTax = 0;
//   this.medicines.forEach(m => {
//     const base = (m.quantity || 0) * (m.pricePerUnit || 0);
//     const tax = (base * (m.gstPercentage || 0)) / 100;
//     m.total = base + tax;
//     medSub += base; medTax += tax;
//   });

//   let equipSub = 0, equipTax = 0;
//   this.additionalEquipment.forEach(e => {
//     const base = (e.quantity || 0) * (e.rate || 0);
//     const tax = (base * (e.gstPercentage || 0)) / 100;
//     e.total = base + tax;
//     equipSub += base; equipTax += tax;
//   });

//   this.totals.subtotal = billingBase + medSub + equipSub;
//   this.totals.gstAmount = billingTax + medTax + equipTax;
//   this.totals.cgst = this.totals.gstAmount / 2;
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
    categoryId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'ItemCategory' 
    },
    categoryName: String, // Denormalized for PDF display
    quantity: { type: Number, default: 1 },
    pricePerUnit: { type: Number, default: 0 },
    gstPercentage: { type: Number, default: 12 },
    total: { type: Number, default: 0 }
  }],
  additionalEquipment: [{
    name: String,
    categoryId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'ItemCategory' 
    },
    categoryName: String, // Denormalized for PDF display
    quantity: { type: Number, default: 1 },
    rate: { type: Number, default: 0 },
    gstPercentage: { type: Number, default: 18 },
    total: { type: Number, default: 0 }
  }],
//   invoicePdfUrl: {
//   type: String,
//   default: null
// },
invoiceUrl: {
  type: String,
  default: null
},
isInvoiceGenerated: {
  type: Boolean,
  default: false
},
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

