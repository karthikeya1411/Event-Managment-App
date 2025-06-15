A full-stack event management web application built using the MERN stack (MongoDB, Express.js, React, Node.js). This project supports event registration, user authentication, and email notifications.

📁 Step 1: Create .env File for Backend Configuration
Create a .env file in the root of the backend directory with the following contents:
PORT=5000
MONGODB_URI=mongodb://localhost:27017/event-management
JWT_SECRET=your-secret-key-here

# Email service configuration
EMAIL_SERVICE_HOST=smtp.gmail.com
EMAIL_SERVICE_PORT=587
EMAIL_SERVICE_SECURE=false # Use true for 465, false for 587 (TLS/STARTTLS)
EMAIL_AUTH_USER=22311a0563@cse.sreenidhi.edu.in # Your Gmail address
EMAIL_AUTH_PASS=lguhwxfzaksewgwk # Use an App Password if 2FA is enabled


⚠️ Important: If you have 2-Step Verification enabled on your Gmail account, you must generate an App Password instead of using your regular password.


✉️ Modify Target Email for Testing
By default, the backend routes may send emails to a preset email address. For testing purposes:
🔧 Open all backend route files where emails are sent and update the following placeholder:
const TARGET_EMAIL_FOR_ALL_MAILS = 'your-email@example.com';

✅ Replace 'your-email@example.com' with your own email address to test email delivery.

🚀 Step 2: Initialize the Backend


Navigate to the backend folder:
cd backend



Install dependencies:
npm install



Start the server:
npm run dev

This should run on http://localhost:5000 by default.



🌐 Step 3: Initialize the Frontend


Navigate to the frontend folder:
cd frontend



Install dependencies:
npm install



Start the React app:
npm start

This should run on http://localhost:3000 by default.



✅ Project Structure (Simplified)
event-management/
├── backend/
│   ├── .env             # Environment variables (you create this)
│   ├── routes/
│   ├── controllers/
│   └── ...
├── frontend/
│   └── src/
├── README.md
└── ...
