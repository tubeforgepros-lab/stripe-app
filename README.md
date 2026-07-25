# Stripe + Prisma + Express on Railway

A Node.js Express app that creates Stripe PaymentIntents, stores order data in Prisma, and marks payments as fulfilled through Stripe webhooks.

## Features

- Create a Stripe PaymentIntent for a $2,500 USD payment.
- Store order data in Prisma.
- Update order status from Stripe webhook events.
- Deploy from GitHub to Railway.
- Keep Stripe secrets out of GitHub.

## Project Structure

```text
my-stripe-app/
├─ prisma/
│  └─ schema.prisma
├─ src/
│  ├─ app.js
│  ├─ lib/
│  │  ├─ prisma.js
│  │  └─ stripe.js
│  └─ routes/
│     ├─ paymentRoutes.js
│     └─ stripeWebhook.js
├─ .gitignore
└─ package.json
```

## Requirements

- Node.js
- GitHub account
- Railway account
- Stripe account
- A PostgreSQL database for Prisma

## Environment Variables

Set these in Railway, not in GitHub:

```env
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_live_or_test_key
STRIPE_WEBHOOK_SECRET=whsec_secret
NODE_ENV=production
PORT=3000
```

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Generate Prisma client:

```bash
npx prisma generate
```

3. Run migrations:

```bash
npx prisma migrate dev
```

4. Start the app:

```bash
npm run dev
```

## API Flow

### Create a PaymentIntent

`POST /api/payments/create-payment-intent`

Example body:

```json
{
  "userId": "user_123",
  "metadata": {
    "plan": "enterprise",
    "source": "web"
  }
}
```

This creates a Stripe PaymentIntent for **$2,500 USD**, which is `250000` cents.

### Stripe Webhook

`POST /webhooks/stripe-webhook`

Listen for:

- `payment_intent.succeeded`
- `payment_intent.payment_failed`

Use the webhook as the source of truth for payment fulfillment.

## Deployment Checklist

### 1. Push code to GitHub
- Make sure all project files are committed.
- Confirm `.env` is listed in `.gitignore`.
- Confirm `package.json` has a valid `start` script.

### 2. Create a Railway project
- Open Railway.
- Click **New Project**.
- Select **Deploy from GitHub repo**.
- Connect your GitHub account if needed.
- Choose this repository.

### 3. Add Railway variables
Add the environment variables listed above in the Railway Variables tab.

### 4. Deploy
- Railway will build and deploy the app.
- Check the logs for errors.
- Make sure the app listens on `process.env.PORT`.

### 5. Generate a Railway domain
- Open the Railway service.
- Go to **Settings**.
- Under **Networking**, generate a public domain.

### 6. Configure Stripe webhooks
- Go to Stripe Dashboard → Developers → Webhooks.
- Add your Railway webhook URL:

```text
https://your-app.up.railway.app/webhooks/stripe-webhook
```

- Subscribe to:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
- Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET` in Railway.

### 7. Test the payment flow
- Call `POST /api/payments/create-payment-intent`.
- Complete the payment in Stripe test mode.
- Confirm the webhook updates the order status to `fulfilled`.

## Prisma Schema

Use a schema that stores order data and Stripe references:

- `Order`
- `WebhookEvent`
- `User`

Keep the full business data in Prisma and only small reference data in Stripe metadata.

## Important Notes

- Stripe metadata has size limits, so keep it short.
- Stripe webhook handlers must use the raw request body.
- Do not use the browser redirect page as your fulfillment signal.
- Use Stripe webhooks to update your local database.

## Common Issues

### Webhook signature verification fails
- Confirm the webhook route is using `express.raw({ type: 'application/json' })`.
- Confirm `STRIPE_WEBHOOK_SECRET` is correct.
- Confirm the Stripe endpoint URL matches your Railway domain exactly.

### Railway deploy succeeds but app does not load
- Confirm the app listens on `process.env.PORT`.
- Check the service logs.
- Verify the `start` script in `package.json`.

### Prisma errors
- Confirm `DATABASE_URL` is set.
- Confirm migrations were applied.
- Regenerate the Prisma client after schema changes.

## Useful Commands

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
npm start
```

## License

MIT
