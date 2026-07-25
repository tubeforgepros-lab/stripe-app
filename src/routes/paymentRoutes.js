const express = require('express');
const prisma = require('../lib/prisma');
const stripe = require('../lib/stripe');

const router = express.Router();

router.post('/create-payment-intent', express.json(), async (req, res) => {
  try {
    const { userId, metadata = {} } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const amount = 250000;

    const order = await prisma.order.create({
      data: {
        userId,
        amount,
        currency: 'usd',
        status: 'pending',
        metadata,
      },
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        order_id: order.id,
        ...Object.fromEntries(
          Object.entries(metadata).map(([k, v]) => [k, String(v)])
        ),
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        stripePaymentIntentId: paymentIntent.id,
        stripePayload: paymentIntent,
      },
    });

    return res.json({
      orderId: order.id,
      amount,
      currency: 'usd',
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
