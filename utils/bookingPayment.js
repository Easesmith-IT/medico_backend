// utils/bookingPayment.js
const normalizeAmount = (value) => {
  const amount = Number(value || 0);
  return Number.isFinite(amount) && amount > 0 ? Number(amount.toFixed(2)) : 0;
};

const derivePaymentStatus = ({ totalAmount = 0, paidAmount = 0 }) => {
  const total = normalizeAmount(totalAmount);
  const paid = normalizeAmount(paidAmount);
  const due = normalizeAmount(total - paid);

  let paymentStatus = "Unpaid";
  if (paid > 0 && due > 0) paymentStatus = "Partially Paid";
  if (due === 0 && total > 0) paymentStatus = "Paid";

  return {
    totalAmount: total,
    paidAmount: paid,
    dueAmount: due,
    paymentStatus,
    isAdvancePaid: paid > 0,
    isFinalPaymentDone: due === 0 && total > 0,
  };
};

module.exports = {
  normalizeAmount,
  derivePaymentStatus,
};