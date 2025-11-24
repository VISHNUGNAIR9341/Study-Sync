# Setting Up PostgreSQL

Since PostgreSQL was not found on your system, you need to install it manually to run the database.

## 1. Install PostgreSQL
1.  **Download**: Go to [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/) and download the installer.
2.  **Install**: Run the installer.
    - **Password**: When asked for a password for the `postgres` superuser, enter `postgres` (or remember what you set, and update the `.env` file later).
    - **Port**: Keep the default port `5432`.
3.  **Finish**: Complete the installation.

## 2. Configure the App
If you used a password other than `postgres`, create a `.env` file in the `backend` folder:

```env
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=student_planner
```

## 3. Initialize the Database
Once PostgreSQL is running, run the setup script:

```bash
cd backend
node setup_db.js
```

This will:
1.  Create the `student_planner` database.
2.  Create the tables (Users, Tasks, Sessions).
3.  Create the default user.

## 4. Verify
Start the application using `start_app.bat` and everything should work!
