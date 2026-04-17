# Kanpur Lab

React + Node.js + Express + MongoDB lab register and PDF reporting app.

## Feature Overview

- Store sample entries in MongoDB using the `Sample` schema.
- Manage samples in an Excel-like register table.
- Add or update test result values for each sample.
- Generate the existing PDF report layout from saved sample data.
- Download the generated PDF or share it through WhatsApp/Web Share where supported.

## Backend Structure

```text
server/
  .env.example
  package.json
  src/
    app.js
    server.js
    config/
      db.js
    controllers/
      sampleController.js
    models/
      Sample.js
    routes/
      sampleRoutes.js
```

## API Endpoints

- `POST /samples` creates a sample entry.
- `GET /samples` lists samples. Supports `search` and `status` query params.
- `GET /samples/:id` returns one sample.
- `PUT /samples/:id` updates sample fields or test results.
- `DELETE /samples/:id` deletes a sample entry.

Example create request:

```json
{
  "supplierName": "ABC Foods",
  "CO": "Kaithal",
  "sampleReference": "Mustard Oil",
  "dateOfSeal": "2026-04-17",
  "dateReceived": "2026-04-17"
}
```

Example test update:

```json
{
  "dateOfTest": "2026-04-17",
  "tests": [
    {
      "name": "Moisture (Including Volatiles)",
      "value": "0.12",
      "unit": "%",
      "referenceValue": ""
    }
  ]
}
```

## Local Setup

1. Install frontend dependencies:

```bash
npm install
```

2. Install backend dependencies:

```bash
npm run server:install
```

3. Create backend environment file:

```bash
copy server\.env.example server\.env
```

4. Update `server/.env` if your MongoDB URL is different:

```text
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/kanpur_lab
CLIENT_ORIGIN=http://localhost:3000
```

5. Start MongoDB locally.

6. Start the backend:

```bash
npm run server
```

7. In another terminal, start the React app:

```bash
npm start
```

The frontend calls `http://localhost:5000` by default. To change it, create a frontend `.env` file:

```text
REACT_APP_API_URL=http://localhost:5000
```

## Frontend Flow

- `Sample Register` opens the new database-backed register.
- `New Entry` saves supplier/sample details to MongoDB.
- `Sample List` shows supplier, reference, received date, and status.
- `View / Add Test Results` opens the result-entry grid.
- `Report` renders the saved sample through the existing PDF layout.
- `Quick Report` keeps the previous context-only report workflow.
