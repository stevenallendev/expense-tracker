Expense Tracker App - layman's README

A simple full-stack expense tracking app where users can log in, add expenses, mark them paid, and filter past spending.

This project has two parts that must run together:

Frontend → The website you use

Backend → The server that stores data

🚀 How to Run the App
1️⃣ Download the project
git clone https://github.com/stevenallendev/expense-tracker.git
cd expense-tracker

🧠 Start the Backend (Server)
cd server
npm install
npm run dev


This starts the API that handles logins and expenses.

Leave this terminal open and running.

🌐 Start the Frontend (Website)

Open a new terminal window:

cd client
npm install
npm run dev


This starts the React app.

🔗 App URLs
Part	URL
Website	http://localhost:5173

Server API	http://localhost:4000

Open 5173 in your browser.

📦 What npm install does

It downloads all the required tools for the project and creates a node_modules folder.

You must run it:

Once in /server

Once in /client

🛑 How to stop the app

In the terminal:

Ctrl + C

🧯 If something breaks

Reinstall dependencies:

rm -rf node_modules
npm install


(Do this in server or client depending on where the issue is.)

🧩 How the app works (simple)
Browser → Frontend → Backend → Database


You use the website → it talks to the server → the server saves your expenses.

✅ Features

User login & signup

Add expenses

Edit & delete expenses

Mark expenses paid/unpaid

View upcoming vs past-due expenses

Filter by month, year, and category

🧑‍💻 Tech Used

React (Frontend)

Express + Node.js (Backend)

SQLite database

Sessions for login authentication

Tip: Always start the server first, then the client.