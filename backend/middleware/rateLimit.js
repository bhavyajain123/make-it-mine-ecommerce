function createRateLimiter({ windowMs, max, message, key }) {
  const hits = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [k, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(k);
    }
  }, windowMs).unref();

  return (req, res, next) => {
    const id = key ? key(req) : req.ip || "unknown";
    const now = Date.now();

    let entry = hits.get(id);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(id, entry);
    }

    entry.count += 1;

    if (entry.count > max) {
      res.set("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ message });
    }

    next();
  };
}

module.exports = { createRateLimiter };