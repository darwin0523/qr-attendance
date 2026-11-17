require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const QRCode = require('qrcode');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// ---------- Models ----------
const Student = mongoose.model('Student', new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  grade: { type: String, required: true }
}));

const attendanceSchema = new mongoose.Schema({
  studentId: String,
  name: String,
  grade: String,
  date: String,   // YYYY-MM-DD
  time: String    // HH:MM:SS
});
attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true }); // one record per student per day
const Attendance = mongoose.model('Attendance', attendanceSchema);

// ---------- Helpers ----------
const TZ = 'Asia/Manila';
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: TZ });
const nowTime = () => new Date().toLocaleTimeString('en-GB', { timeZone: TZ });

// ---------- Routes ----------
// Add student
app.post('/api/students', async (req, res) => {
  try {
    const { studentId, name, grade } = req.body;
    const s = await Student.create({ studentId: studentId.trim(), name: name.trim(), grade: grade.trim() });
    res.json(s);
  } catch (e) {
    res.status(400).json({ error: e.code === 11000 ? 'Student ID already exists' : e.message });
  }
});

// List students
app.get('/api/students', async (req, res) => {
  res.json(await Student.find().sort({ grade: 1, name: 1 }));
});

// Delete student
app.delete('/api/students/:id', async (req, res) => {
  await Student.deleteOne({ studentId: req.params.id });
  res.json({ ok: true });
});

// QR code image (data URL) for a student
app.get('/api/students/:id/qr', async (req, res) => {
  const s = await Student.findOne({ studentId: req.params.id });
  if (!s) return res.status(404).json({ error: 'Student not found' });
  const qr = await QRCode.toDataURL(s.studentId, { width: 300, margin: 2 });
  res.json({ qr, student: s });
});

// Scan -> mark attendance
app.post('/api/scan', async (req, res) => {
  const studentId = String(req.body.studentId || '').trim();
  const student = await Student.findOne({ studentId });
  if (!student) return res.status(404).json({ status: 'error', message: 'Unknown QR code' });

  try {
    const rec = await Attendance.create({
      studentId, name: student.name, grade: student.grade, date: today(), time: nowTime()
    });
    res.json({ status: 'ok', message: `Present: ${student.name}`, record: rec });
  } catch (e) {
    if (e.code === 11000) return res.json({ status: 'duplicate', message: `${student.name} is already marked present today` });
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// Attendance list by date (default today)
app.get('/api/attendance', async (req, res) => {
  const date = req.query.date || today();
  const present = await Attendance.find({ date }).sort({ time: 1 });
  const all = await Student.find();
  const presentIds = new Set(present.map(p => p.studentId));
  const absent = all.filter(s => !presentIds.has(s.studentId));
  res.json({ date, present, absent });
});

// ---------- Start ----------
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT || 3000, () =>
      console.log(`Running at http://localhost:${process.env.PORT || 3000}`));
  })
  .catch(err => { console.error('MongoDB connection error:', err.message); process.exit(1); });
