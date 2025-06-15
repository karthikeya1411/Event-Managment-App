# 🌐 MERN Event Management System

A full-stack event management web application built using the **MERN stack** (MongoDB, Express.js, React, Node.js). This project supports event registration, user authentication, and email notifications.

---

## 📁 Setup Instructions

Follow these steps to get the project up and running on your local machine.

### 1. Create `.env` File for Backend

Create a file named `.env` inside your **`backend/`** directory (at the same level as `package.json` in the backend folder) with the following content:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/event-management
JWT_SECRET=

# Email Service Configuration (for Nodemailer)
EMAIL_SERVICE_HOST=smtp.gmail.com
EMAIL_SERVICE_PORT=587
EMAIL_SERVICE_SECURE=false # Use true for port 465 (SSL), false for port 587 (TLS/STARTTLS)
EMAIL_AUTH_USER= # Your Gmail address
EMAIL_AUTH_PASS= # IMPORTANT: Use an App Password if 2FA is enabled for your Gmail account.
```
⚠️ Important Note on Email Passwords: If your Gmail account has 2-Step Verification enabled, you must use a Gmail App Password instead of your regular Gmail password for EMAIL_AUTH_PASS. This is a security measure by Google.
2. Configure Target Email for Testing
To ensure email notifications are sent to your preferred address during development and testing:
•	Open the relevant backend route/controller files where emails are sent (e.g., in backend/controllers or backend/routes).
•	Locate and update the following line:```
 	const TARGET_EMAIL_FOR_ALL_MAILS = 'your-email@example.com';```
•	Replace 'your-email@example.com' with your actual email address.
3. Initialize the Backend
Navigate to the backend/ directory in your terminal:
cd backend
Install dependencies:
```
npm install
Start the backend server (ensure nodemon is installed globally or as a dev dependency):
npm run dev
```
The backend server will now be running on http://localhost:5000.
4. Initialize the Frontend
Open a new terminal window and navigate to the frontend/ directory:
```
cd frontend
Install dependencies:
npm install
Start the React development server:
npm start
```
The React application will open in your browser, typically at http://localhost:3000.

📂 Project Structure
event-management/
├── backend/
│   ├── .env                 # Environment variables for the server
│   ├── routes/              # API routes
│   ├── controllers/         # Logic for routes
│   ├── models/              # MongoDB schemas
│   ├── server.js            # Main backend entry file
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/                 # React source code
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── .gitignore               # Specifies intentionally untracked files
└── README.md                # This file
________________________________________
✅ Troubleshooting
•	MongoDB Issues: Ensure MongoDB is installed on your machine and its service is running. You can check its status or start it via your system's services manager.
•	CORS Errors: If you encounter Cross-Origin Resource Sharing (CORS) errors, confirm that your backend server is correctly configured to allow requests from http://localhost:3000. Check your server.js or app.js file in the backend for CORS middleware.
•	Email Not Sent:
o	Verify your EMAIL_AUTH_USER and EMAIL_AUTH_PASS in the backend .env file.
o	If using Gmail, ensure you've generated and used an App Password if 2-Step Verification is enabled.
o	Double-check the TARGET_EMAIL_FOR_ALL_MAILS in your backend code.
o	Ensure your internet connection is active.
________________________________________
🤝 Contributing
Contributions are welcome! If you have suggestions for improvements, find bugs, or want to add new features, please feel free to:
1.	Fork the repository.
2.	Create a new branch (git checkout -b feature/YourFeatureName).
3.	Make your changes.
4.	Commit your changes (git commit -m 'feat: Add new feature').
5.	Push to the branch (git push origin feature/YourFeatureName).
6.	Open a Pull Request.
________________________________________
