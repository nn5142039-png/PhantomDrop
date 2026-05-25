import { Router } from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const MAX_TTL = 86400; // 24 hours
const DEFAULT_TTL = 3600; // 1 hour
const MAX_PAYLOAD_SIZE = 500000; // ~500KB

// Define Mongoose Schema
const secretSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  ciphertext: { type: String, required: true },
  iv: { type: String, required: true },
  salt: { type: String, required: true },
  expireAt: { type: Date, required: true }
});

// Create TTL index on expireAt field
secretSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

const Secret = mongoose.model('Secret', secretSchema);

async function createStore() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/phantomdrop';
  
  try {
    await mongoose.connect(mongoUri);
    console.log(`   Store: MongoDB (connected to ${mongoUri})`);
    
    return {
      set: async (key, value, ttl) => {
        const payload = JSON.parse(value);
        // Calculate expiration date
        const expireAt = new Date(Date.now() + ttl * 1000);
        
        await Secret.create({
          _id: key,
          ciphertext: payload.ciphertext,
          iv: payload.iv,
          salt: payload.salt,
          expireAt
        });
      },
      get: async (key) => {
        const doc = await Secret.findById(key).lean();
        if (!doc) return null;
        return JSON.stringify({
          ciphertext: doc.ciphertext,
          iv: doc.iv,
          salt: doc.salt
        });
      },
      del: async (key) => {
        await Secret.findByIdAndDelete(key);
      }
    };
  } catch (err) {
    console.error(`   MongoDB unavailable (${err.message})`);
    throw err;
  }
}

export async function createSecretRoutes() {
  const router = Router();
  const store = await createStore();

  /**
   * POST /api/secret
   * Store an encrypted note.
   * Body: { ciphertext, iv, salt, ttl? }
   */
  router.post('/secret', async (req, res) => {
    try {
      const { ciphertext, iv, salt, ttl } = req.body;

      // Validate required fields
      if (!ciphertext || !iv || !salt) {
        return res.status(400).json({ error: 'Missing required fields: ciphertext, iv, salt' });
      }

      // Validate payload size
      if (ciphertext.length > MAX_PAYLOAD_SIZE) {
        return res.status(413).json({ error: 'Payload too large. Maximum note size is ~500KB.' });
      }

      // Sanitize TTL
      const effectiveTTL = Math.min(Math.max(parseInt(ttl) || DEFAULT_TTL, 60), MAX_TTL);

      // Generate unique ID
      const id = uuidv4();

      // Store the encrypted payload
      const payload = JSON.stringify({ ciphertext, iv, salt });
      await store.set(id, payload, effectiveTTL);

      res.status(201).json({ 
        id, 
        expiresIn: effectiveTTL,
        message: 'Secret stored. It will self-destruct after first read or TTL expiry.' 
      });
    } catch (err) {
      console.error('POST /secret error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * GET /api/secret/:id
   * Retrieve and BURN an encrypted note (one-time read).
   */
  router.get('/secret/:id', async (req, res) => {
    try {
      const { id } = req.params;

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: 'Invalid secret ID format' });
      }

      // Fetch from store
      const data = await store.get(id);

      if (!data) {
        return res.status(404).json({ 
          error: 'Secret not found. It may have already been read or expired.',
          burned: true 
        });
      }

      // BURN — delete immediately after retrieval (one-time read)
      await store.del(id);

      const payload = JSON.parse(data);
      res.json(payload);
    } catch (err) {
      console.error('GET /secret/:id error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
