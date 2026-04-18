# Kanpur Lab

React + Node.js + Express + MongoDB lab register and PDF reporting app.

## Feature Overview

- Store sample entries in MongoDB using the `Sample` schema.
- Automatically assign yearly report numbers such as `KL/2026/0001`.
- Manage samples in an Excel-like register table.
- View dashboard counters for total, pending, tested, and reported samples.
- Export the currently filtered register to CSV or Excel-compatible `.xls`.
- Admin login protects the register and supplier management screens.
- Use supplier autocomplete from saved supplier master records plus previous register entries.
- Store supplier WhatsApp numbers, contact person, and address.
- Add or update test result values for each sample.
- Edit report details such as `To M/s`, lorry number, bags, weight, and condition of sample.
- Generate the existing PDF report layout from saved sample data.
- Download the generated PDF or share it to a saved supplier WhatsApp number where available.

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
      authController.js
      sampleController.js
      supplierController.js
    middleware/
      authMiddleware.js
    models/
      Admin.js
      Counter.js
      Sample.js
      Supplier.js
    routes/
      authRoutes.js
      sampleRoutes.js
      supplierRoutes.js
```

## API Endpoints

- `POST /samples` creates a sample entry.
- `GET /samples` lists samples. Supports `search` and `status` query params.
- `GET /samples/stats/summary` returns dashboard counters. Supports `search`, `startDate`, and `endDate`.
- `GET /samples/:id` returns one sample.
- `PUT /samples/:id` updates sample fields or test results.
- `DELETE /samples/:id` deletes a sample entry.
- `POST /auth/login` logs in an admin.
- `GET /auth/me` verifies the current admin token.
- `GET /suppliers` lists supplier master records.
- `POST /suppliers` creates a supplier. Requires admin token.
- `PUT /suppliers/:id` updates supplier details. Requires admin token.
- `DELETE /suppliers/:id` deletes a supplier. Requires admin token.

Example create request:

```json
{
  "supplierName": "ABC Foods",
  "CO": "Kaithal",
  "toMs": "Customer Name",
  "sampleReference": "Mustard Oil",
  "dateOfSeal": "2026-04-17",
  "dateReceived": "2026-04-17",
  "lorryNo": "HR-08-1234",
  "bags": "10",
  "weight": "500 kg",
  "conditionOfSample": "Sealed"
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
AUTH_SECRET=replace-with-a-long-random-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
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

Default admin login is controlled by `server/.env`. For local development:

```text
Username: admin
Password: admin123
```

Change `ADMIN_PASSWORD` and `AUTH_SECRET` before real use.

The frontend calls `http://localhost:5000` by default. To change it, create a frontend `.env` file:

```text
REACT_APP_API_URL=http://localhost:5000
```

## Frontend Flow

- `Sample Register` opens the new database-backed register.
- `New Entry` saves supplier/sample details to MongoDB.
- `Sample List` shows supplier, reference, received date, and status.
- Search supports report number, supplier, reference, and C/o.
- Date filters narrow the register by received date.
- `Export CSV` and `Export Excel` download the current filtered register view.
- `Supplier Master` lets admins add, edit, and delete supplier WhatsApp details.
- Supplier fields use autocomplete suggestions from saved supplier master records and loaded sample history.
- `View / Add Test Results` opens editable sample/report details plus the result-entry grid.
- `Report` renders the saved sample through the existing PDF layout.
- `Share to Supplier WhatsApp` opens the saved supplier number directly. If no number is saved, it falls back to generic WhatsApp share.
