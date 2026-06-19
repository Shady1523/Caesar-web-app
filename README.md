# 🍕 Little Caesars Pizza Tracker

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Django](https://img.shields.io/badge/django-%23092E20.svg?style=for-the-badge&logo=django&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/postgresql-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![Playwright](https://img.shields.io/badge/playwright-%232EAD33.svg?style=for-the-badge&logo=playwright&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/github%20actions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white)

A full-stack web application that utilizes headless browser automation to scrape, store, and filter menu items, prices, and nutritional data from Little Caesars locations based on user-provided zip codes.

**[🚀 Try the Live Application Here](https://pizzascanner.org/)**

---

## 📸 Previews
 ![Scraper View](https://github.com/user-attachments/assets/89777f86-ec0b-409c-bd2f-4d2e38ec98b9) | ![Database View](https://github.com/user-attachments/assets/d997a6cc-d2fa-4279-94e8-527a85d1316c)

## 💡 The Inspiration
I originally conceived this project to solve a personal frustration. As a budget-conscious student, I would manually check different Little Caesars locations to find the best prices. However, the official website's UI requires repetitive zip-code entries and frequently resets user sessions, making comparisons incredibly tedious. 

When I searched for an existing tool, I realized no tool existed that could track live, dynamic pricing across different store locations. 

I decided to build my own solution. What started as an idea to automate a repetitive manual task evolved into this full-stack, distributed web application designed to make fast, session-cached price comparisons between multiple Little Caesars restaurants located within the user's entered zip code.

## ✨ Features
* **Automated Data Extraction:** Built with Python and Playwright to navigate complex dynamic UIs and extract live pricing, calorie, item name, and location data.
* **Interactive Dashboard:** A mobile-responsive React frontend featuring client-side pagination and real-time filtering/sorting by item name, maximum price, and maximum calories.
* **Containerized Architecture:** Fully dockerized Django REST Framework backend to ensure consistent dependency management (like Linux browser binaries for Playwright) across environments.
* **Production Ready:** Configured for cross-origin resource sharing (CORS), Nginx reverse proxying, and managed AWS deployment with Swap memory optimization.

## ☁️ Deployment Architecture
* **Frontend Hosting:** Deployed globally via Vercel for fast edge content delivery.
* **Backend Server:** Hosted on an Amazon Web Services (AWS) EC2 instance running Ubuntu Linux.
* **CI/CD Pipeline:** Fully automated zero-downtime deployment pipeline built with GitHub Actions, utilizing secure SSH key injections to trigger live Docker container rebuilds on AWS upon every code push.
* **Containerization:** The Django application, Gunicorn WSGI server, and Playwright Chromium binaries are fully containerized using Docker.
* **Proxy & Security:** Nginx is used as a reverse proxy to handle incoming requests, enforce HTTPS, and manage CORS headers between the Vercel frontend and AWS backend.
* **Memory Management:** Configured with a 4GB SSD Swap file to prevent Linux Out-Of-Memory (OOM) errors during heavy browser automation tasks.

## 🔌 API Reference
The backend serves data to the frontend via a Django REST framework API.

| Endpoint | Method | Description |
|---|---|---|
| `/` | `POST` | Triggers the Playwright script to scrape a given zip code. |
| `/stores/` | `GET` | Retrieves the paginated list of saved menu items. |
| `/api/check_scrape_status/` | `GET` | Checks user IP to count the number of times they successfully scraped a zip-code. |
| `/api/db_version/` | `GET` | Retrieves the last scraped element to check changes in the database. |

## 💻 Tech Stack
* **Frontend:** React, Vite, Tailwind CSS, React Router
* **Backend:** Python, Django REST Framework, Playwright (Headless Chromium), PostgreSQL, AWS RDS
* **Infrastructure & Deployment:** Docker, Docker Compose, GitHub Actions (CI/CD), Gunicorn, AWS EC2, Vercel, Nginx

---

## ⚙️ Local Installation & Setup

### Prerequisites
* Docker and Docker Compose installed on your machine.
* Node.js and npm (for local frontend development).

### Backend Setup
1. Clone the repository:
```bash
git clone https://github.com/Shady1523/Caesar-web-app.git
```

2. Navigate to the backend directory and create a .env file with this exact information:
   ```Code Snippet
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   CORS_ALLOWED_ORIGINS=http://localhost:5173
   CSRF_TRUSTED_ORIGINS=http://localhost:5173
   SECRET_KEY=[your_generated_django_secret_key_here]
   DATABASE_URL=[your_postgres_database_url_here]
   ```

3. Build and run the Docker containers:
   ```Bash
   docker compose up --build
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```Bash
   cd frontend
   ```

2. Install dependencies:
   ```Bash
   npm install
   ```

3. Create a .env file for your API URL:
   ```Code Snippet
   VITE_API_BASE_URL=http://localhost:8000/
   ```

4. Start the development server:
   ```Bash
   npm run dev
   ```