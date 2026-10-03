# AuthGuard — Adaptive Authentication & Access Control

**Team:** Authenticators  
**Team Leader:** Yug Patel (038)  
**Email:** Yugpatel.bscit2025@aurouniversity.edu.in  
**Member:** Parth M. Ludhwani  
**Email:** parth.ludhwani.bscit2025@aurouniversity.edu.in

## Project
AuthGuard is a Node.js/Express academic prototype for authentication, JWT-protected APIs, role-based access control, adaptive risk evaluation, account lockout and audit logging.

## Structure
```text
AuthGuard/
├── backend/
│   ├── app.js
│   ├── database/
│   ├── security/
│   ├── routes/
│   └── middleware/
├── frontend/
│   ├── index.html
│   ├── css/
│   └── js/
├── tests/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Requirements
- Node.js 18+ recommended
- npm

## Run
```bash
npm install
cp .env.example .env
npm start
```
Then open: `http://localhost:3000`

## Demo Accounts
- Admin: `yug` / `admin123`
- Manager: `parth` / `manager123`
- User: `demo` / `user123`

## Main API
- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/profile`
- `GET /api/risk`
- `GET /api/protected`
- `GET /api/manager`
- `GET /api/admin`
- `GET /api/users`
- `GET /api/audit`
- `GET /api/admin/stats`

## Adaptive Security
Risk from: recent failed attempts, device trust, location context, sensitive-action flag.

Risk levels: Low → allow | Medium → step-up MFA recommended | High → deny or step-up

## Important
Academic prototype only. Not for production without proper DB, HTTPS, MFA, rate limiting, etc.
