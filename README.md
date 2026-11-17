# QR Attendance (Elementary School)

## Setup
1. Install Node.js (https://nodejs.org) and MongoDB Community (or use a free MongoDB Atlas cluster).
2. Open this folder in VS Code → Terminal → New Terminal.
3. `npm install`
4. Edit `.env` if you use Atlas (paste your connection string in MONGO_URI).
5. `npm start`  → open http://localhost:3000

## How to use
1. **Students tab** → add students, click **QR** → print each child's QR code (ID card / notebook).
2. **Scan tab** → allow camera, children show their QR code → marked present.
3. **Attendance tab** → see present/absent list by date.

Note: camera access works on `localhost` or HTTPS only.
