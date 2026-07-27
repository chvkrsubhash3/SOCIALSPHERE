import { Request, Response } from 'express';
import { db, rawQuery } from '../config/database';
import { config } from '../config/env';
import { redis } from '../config/redis';
import { logSecurityEvent, logAudit } from '../utils/logger';

// ═══════════════════════════════════════════════════════════════
//                  MARKETPLACE CONTROLLER
//
// Vulnerabilities: IDOR, Business Logic, Race Conditions,
//                  Mass Assignment, CSRF
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// CREATE LISTING
//
// ⚠️ VULN: Mass Assignment
// ─────────────────────────────────────────────
export async function createListing(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;

  if (config.trainingMode) {
    // ⚠️ VULN #18: Mass Assignment
    // Directly spreads request body into DB insert
    // Attacker can set: { "is_featured": true, "seller_id": 1, "price": 0 }
    // CWE-915: Improperly Controlled Modification of Dynamically-Determined Object Attributes
    const [listing] = await db('marketplace_listings').insert({
      ...req.body,  // ⚠️ Mass assignment
      seller_id: userId,
      created_at: new Date(),
    }).returning('*');

    res.status(201).json({ listing });
  } else {
    // 🔒 SECURE: Explicit field allowlist
    const { title, description, price, category, condition, images } = req.body;

    if (!title || price === undefined || !category) {
      res.status(400).json({ error: 'Title, price, and category are required' });
      return;
    }

    const [listing] = await db('marketplace_listings').insert({
      seller_id: userId,
      title: title.substring(0, 200),
      description: description?.substring(0, 2000),
      price: Math.max(0, parseFloat(price)),
      category,
      condition,
      images: JSON.stringify(images || []),
      status: 'active',
      is_featured: false,  // 🔒 Never from user input
      created_at: new Date(),
    }).returning('*');

    res.status(201).json({ listing });
  }
}

// ─────────────────────────────────────────────
// PURCHASE LISTING
//
// ⚠️ VULN #20: Race Condition (buy same item twice)
// ⚠️ VULN #21: Business Logic (negative price, buy own item)
// ⚠️ VULN #6: CSRF (no token required)
// ─────────────────────────────────────────────
export async function purchaseListing(req: Request, res: Response): Promise<void> {
  const { listingId } = req.params;
  const userId = req.user!.userId;

  const listing = await db('marketplace_listings')
    .where({ id: listingId })
    .first();

  if (!listing) {
    res.status(404).json({ error: 'Listing not found' });
    return;
  }

  if (config.trainingMode) {
    // ⚠️ VULN #21: Buy your own listing
    // No check if buyer === seller

    // ⚠️ VULN #21: Negative price manipulation
    // If price is stored as string/user-controlled, can be made negative

    // ⚠️ VULN #20: Race Condition
    // Non-atomic purchase — two requests simultaneously can double-purchase
    const userCoins = await db('user_coins').where({ user_id: userId }).first();

    if (userCoins.balance < listing.price) {
      res.status(400).json({
        error: 'Insufficient coins',
        balance: userCoins.balance,
        required: listing.price,  // ⚠️ Info leak
      });
      return;
    }

    // ⚠️ Non-atomic: between these two queries, another request can deduct coins
    await db('user_coins')
      .where({ user_id: userId })
      .update({ balance: userCoins.balance - listing.price });

    await db('marketplace_orders').insert({
      buyer_id: userId,
      listing_id: listingId,
      amount: listing.price,
      status: 'completed',
      created_at: new Date(),
    });

    // ⚠️ Listing stays active — can be purchased again (race condition)
    res.json({
      message: 'Purchase successful',
      orderId: Date.now(),
      amountCharged: listing.price,
    });
  } else {
    // 🔒 SECURE: Atomic transaction + locking
    try {
      await db.transaction(async (trx) => {
        // 🔒 SELECT FOR UPDATE — prevents race condition
        const listingLocked = await trx('marketplace_listings')
          .where({ id: listingId, status: 'active' })
          .forUpdate()
          .first();

        if (!listingLocked) {
          throw Object.assign(new Error('Listing not available'), { status: 409 });
        }

        // 🔒 Prevent buying own listing
        if (listingLocked.seller_id === userId) {
          throw Object.assign(new Error('Cannot purchase your own listing'), { status: 400 });
        }

        // 🔒 Atomic balance check + deduction
        const updated = await trx('user_coins')
          .where({ user_id: userId })
          .where('balance', '>=', listingLocked.price)
          .decrement('balance', listingLocked.price)
          .returning('balance');

        if (updated.length === 0) {
          throw Object.assign(new Error('Insufficient coins'), { status: 400 });
        }

        // Mark listing as sold (prevent re-purchase)
        await trx('marketplace_listings')
          .where({ id: listingId })
          .update({ status: 'sold' });

        const [order] = await trx('marketplace_orders').insert({
          buyer_id: userId,
          listing_id: listingId,
          seller_id: listingLocked.seller_id,
          amount: listingLocked.price,
          status: 'completed',
          created_at: new Date(),
        }).returning('*');

        res.json({ message: 'Purchase successful', order });
      });
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
}

// ─────────────────────────────────────────────
// GET ORDER (IDOR)
//
// ⚠️ VULN #9: IDOR — Access any order by ID
// ─────────────────────────────────────────────
export async function getOrder(req: Request, res: Response): Promise<void> {
  const { orderId } = req.params;
  const userId = req.user!.userId;

  if (config.trainingMode) {
    // ⚠️ VULN #9: No ownership check
    // Any user can access any order
    const order = await db('marketplace_orders').where({ id: orderId }).first();
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json({ order });
  } else {
    // 🔒 SECURE: Ownership check
    const order = await db('marketplace_orders')
      .where({ id: orderId })
      .where((b) => b.where({ buyer_id: userId }).orWhere({ seller_id: userId }))
      .first();

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json({ order });
  }
}

// ─────────────────────────────────────────────
// BUSINESS LOGIC — Coin manipulation
//
// ⚠️ VULN #21: Infinite Coins via negative amount
// ─────────────────────────────────────────────
export async function transferCoins(req: Request, res: Response): Promise<void> {
  const { recipientId, amount } = req.body;
  const senderId = req.user!.userId;

  if (config.trainingMode) {
    // ⚠️ VULN #21: Negative amount transfer = receive coins
    // POST { "recipientId": 2, "amount": -1000 }
    // Result: sender gets +1000 coins, recipient loses 1000

    await db('user_coins')
      .where({ user_id: senderId })
      .decrement('balance', amount);  // ⚠️ Negative amount = increment

    await db('user_coins')
      .where({ user_id: recipientId })
      .increment('balance', amount);  // ⚠️ Negative amount = decrement

    res.json({ message: `Transferred ${amount} coins` });
  } else {
    // 🔒 SECURE: Validate amount is positive
    const parsedAmount = parseInt(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      res.status(400).json({ error: 'Amount must be a positive number' });
      return;
    }

    if (senderId === parseInt(recipientId)) {
      res.status(400).json({ error: 'Cannot transfer to yourself' });
      return;
    }

    await db.transaction(async (trx) => {
      const sender = await trx('user_coins')
        .where({ user_id: senderId })
        .where('balance', '>=', parsedAmount)
        .forUpdate()
        .first();

      if (!sender) {
        throw Object.assign(new Error('Insufficient coins'), { status: 400 });
      }

      await trx('user_coins').where({ user_id: senderId }).decrement('balance', parsedAmount);
      await trx('user_coins').where({ user_id: recipientId }).increment('balance', parsedAmount);
    });

    res.json({ message: `Transferred ${parsedAmount} coins` });
  }
}
