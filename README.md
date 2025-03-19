# QuickPay Craft

A modern payment solution integrated with Digiflazz API.

## Project Structure

```
quickpay-craft-13/
├── src/               # Frontend source code
├── backend/           # Backend source code
│   ├── src/          # Backend TypeScript files
│   └── dist/         # Compiled backend code
├── dist/             # Compiled frontend code
└── public/           # Static assets
```

## Prerequisites

- Node.js 18 or higher
- npm 9 or higher

## Development Setup

1. Clone the repository:
```bash
git clone [repository-url]
cd quickpay-craft-13
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy example environment files
cp backend/.env.example backend/.env
```

4. Update the environment variables in `backend/.env` with your credentials:
- `DIGIFLAZZ_USERNAME`: Your Digiflazz username
- `DIGIFLAZZ_DEV_KEY`: Your Digiflazz development key
- Other variables as needed

5. Start development servers:

For frontend:
```bash
npm run dev
```

For backend:
```bash
cd backend
npm run dev
```

## Building for Production

1. Build the entire project (frontend and backend):
```bash
npm run build
```

This will:
- Build the frontend (TypeScript compilation and Vite build)
- Build the backend (TypeScript compilation)
- Install all necessary dependencies

2. The build output will be:
- Frontend: `./dist/`
- Backend: `./backend/dist/`

## Production Deployment

1. Set up production environment variables:
```bash
# In backend/.env
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
PUBLIC_URL=https://your-backend-domain.com
DIGIFLAZZ_USERNAME=your_production_username
DIGIFLAZZ_DEV_KEY=your_production_key
```

2. Start the production server:
```bash
npm run start
```

## API Endpoints

### Transaction API
- `POST /api/transaction`
  - Create a new transaction
  - Body: `{ product_code, customer_id, ref_id }`

### Callback API
- `POST /api/callback/digiflazz`
  - Webhook endpoint for Digiflazz callbacks
  - Handles transaction status updates

## Features

- Secure API key management
- Transaction processing
- Webhook handling for callbacks
- Development and production environments
- CORS configuration
- TypeScript support

## Security Notes

- Never commit `.env` files
- Use appropriate environment variables for different environments
- Keep API keys secure
- Validate all incoming webhook signatures in production

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

ISC
