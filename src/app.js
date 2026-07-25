require('dotenv').config();

const express = require('express');
const paymentRoutes = require('./routes/paymentRoutes');
const stripeWebhookRoutes = require('./routes/stripeWebhook');

const app = express();

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/payments', paymentRoutes);
app.use('/webhooks', stripeWebhookRoutes);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
