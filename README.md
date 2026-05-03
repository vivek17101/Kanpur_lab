# Kanpur Laboratory

Kanpur Laboratory is a React, Express, MongoDB, and Electron app for managing sample entries, supplier records, test results, and branded PDF reports.

## Highlights

- Creates yearly report numbers such as `KL/2026/0001`.
- Stores samples, test results, and supplier details in MongoDB.
- Shows register counters for total, pending, tested, and reported samples.
- Filters the sample register by search text, status, and date range.
- Exports the current register view to CSV and Excel-compatible `.xls`.
- Suggests saved supplier names and sample types while still allowing manual entry.
- Generates the current Kanpur Laboratory PDF report layout.
- Supports report sharing through WhatsApp when a supplier number is available.
- Uses the updated `KanpurLab_AppLogo192` desktop app icon in the Electron shell.

## Project Structure

```text
src/
  assets/
  components/
  data/
  services/
electron/
  main.js
public/
  KanpurLab_AppLogo.ico
  KanpurLab_AppLogo192.png
  KanpurLab_AppLogo512.png
server/
  src/
    config/
    controllers/
    middleware/
    models/
    routes/
```

## Main Flows

- `New Entry` creates a sample with supplier and transport details.
- `Sample List` shows saved records and supports filtering plus export.
- `View / Add Test Results` updates sample details and lab test values.
- `Report` previews the saved report and supports download or share.
- `Supplier Master` manages supplier contact details used by the register and sharing flow.

## API Summary

- `POST /samples` creates a sample.
- `GET /samples` lists samples with filters.
- `GET /samples/stats/summary` returns dashboard counts.
- `GET /samples/:id` fetches one sample.
- `PUT /samples/:id` updates sample details or test results.
- `DELETE /samples/:id` deletes a sample.
- `POST /auth/login` signs in an admin.
- `GET /auth/me` validates the current session.
- `GET /suppliers` lists suppliers.
- `POST /suppliers` creates a supplier.
- `PUT /suppliers/:id` updates a supplier.
- `DELETE /suppliers/:id` deletes a supplier.

## Local Setup

1. Install frontend dependencies.

```bash
npm install
```

2. Install backend dependencies.

```bash
npm run server:install
```

3. Create the backend environment file.

```bash
copy server\.env.example server\.env
```

4. Generate a secure AUTH_SECRET for the backend:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Then update `server/.env` with the generated secret and change the default admin password:

```text
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/kanpur_lab
CLIENT_ORIGIN=http://localhost:3000
AUTH_SECRET=<paste-generated-secret-here>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<change-to-strong-password>
```

5. (Optional) Create `.env` in the root directory if using environment variables during React build:

```text
REACT_APP_API_URL=http://localhost:5000
```

6. Start MongoDB.

6. Start the backend.

```bash
npm run server
```

7. Start the frontend in another terminal.

```bash
npm start
```

Default local admin credentials:

```text
Username: admin
Password: admin123
```

## Desktop Build

Create a production web build:

```bash
npm run build
```

Create the Electron desktop package:

```bash
npm run electron:build
```

The Electron app loads the production build from `build/` and uses the updated logo assets from `public/`.
