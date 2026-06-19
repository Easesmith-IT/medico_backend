const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Doctor = require('../models/doctorModel');
const Patient = require('../models/patientModel');
const DoctorAppointment = require('../models/doctorAppointmentModel');
const ChatRoom = require('../models/chatRoomModel');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB.");
    
    // Find a booking
    const booking = await DoctorAppointment.findOne({
      status: { 
        $in: ['Approved', 'Confirmed', 'In-Progress', 'Completed', 'TreatmentCompleted', 'Started', 'Pending'] 
      },
      isDeleted: { $ne: true }
    });
    
    if (!booking) {
      console.log("No valid bookings found. Let's list some users instead.");
      const doctor = await Doctor.findOne();
      const patient = await Patient.findOne();
      console.log("Doctor:", doctor ? { id: doctor._id, name: doctor.firstName } : "None");
      console.log("Patient:", patient ? { id: patient._id, name: patient.firstName } : "None");
    } else {
      console.log("Booking found:", {
        id: booking._id,
        doctorId: booking.doctorId,
        patientId: booking.patientId,
        status: booking.status
      });
      
      const doctor = await Doctor.findById(booking.doctorId);
      const patient = await Patient.findById(booking.patientId);
      console.log("Doctor Name:", doctor ? doctor.firstName : "Unknown");
      console.log("Patient Name:", patient ? patient.firstName : "Unknown");

      // Check if room exists
      const room = await ChatRoom.findOne({
        participants: {
          $all: [
            { $elemMatch: { userId: booking.doctorId, userModel: 'Doctor' } },
            { $elemMatch: { userId: booking.patientId, userModel: 'Patient' } }
          ]
        }
      });
      console.log("ChatRoom Room Type:", room ? room.roomType : "None");
      console.log("ChatRoom ID:", room ? room._id : "None");
    }
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error("DB connection error:", err);
  });
