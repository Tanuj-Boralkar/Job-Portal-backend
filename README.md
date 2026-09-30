# HireDesk backend

See `../README.md` for complete setup, database configuration, sample accounts and API notes.

Run `npm install`, `npm run setup`, configure `.env`, then `npm run dev`. Run `npm test` for the regression suite. `npm run seed` requires an empty database and creates demo accounts/jobs. It no longer silently deletes existing data.

node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
