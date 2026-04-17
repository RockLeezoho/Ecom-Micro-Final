# Frontend Apps

- `customer-app`: Customer registration/login UI
- `management-portal`: Staff/Admin login UI

## Run customer app

```bash
cd frontend/customer-app
npm install
npm run dev
```

## Run management portal

```bash
cd frontend/management-portal
npm install
npm run dev
```

Set API base URL for both apps with `VITE_IDENTITY_API_BASE_URL` if your Identity Service is not on `http://localhost:8001/api/v1/auth`.
