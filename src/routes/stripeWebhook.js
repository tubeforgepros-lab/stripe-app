const express = require('express');
const prisma = require('../lib/prisma');
const stripe = require('../lib/stripe');

const router = express.Router();

router.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const alreadyProcessed = await prisma.webhookEvent.findUnique({
      where: { stripeEventId: event.id },
    });

    if (alreadyProcessed) {
      return res.json({ received: true, duplicate: true });
    }

    await prisma.webhookEvent.create({
      data: {
        stripeEventId: event.id,
        type: event.type,
        payload: event.data.object,
      },
    });

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;

      const order = await prisma.order.findUnique({
        where: { stripePaymentIntentId: pi.id },
      });

      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'fulfilled',
            stripePayload: pi,
          },
        });
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object;

      const order = await prisma.order.findUnique({
        where: { stripePaymentIntentId: pi.id },
      });

      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'failed',
            stripePayload: pi,
          },
        });
      }
    }

    return res.json({ received: true });
  } catch (err) {
    return res.status(500).send(`Server Error: ${err.message}`);
  }
});

module.exports = router;
