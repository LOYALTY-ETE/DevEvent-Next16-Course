import mongoose, { Connection, Mongoose } from 'mongoose';

/**
 * Shape of the cached connection object stored on the global scope.
 * This prevents creating multiple connections in development when
 * Next.js hot-reloads or re-imports modules.
 */
interface MongooseCache {
  conn: Connection | null;
  promise: Promise<Mongoose> | null;
}

/**
 * Extend the Node.js global type to include our cached Mongoose connection.
 *
 * We use `declare global` so TypeScript understands that `global.mongoose`
 * may exist. This is safe because the declaration is only augmenting the
 * existing `global` type and not changing runtime behavior.
 */
// eslint-disable-next-line no-var
declare global {
  // `var` is required here because we are augmenting the Node.js global scope.
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

/**
 * Reuse the existing cached connection if it exists on the global scope,
 * otherwise initialize a new cache object.
 */
const globalForMongoose = global as typeof globalThis & {
  mongoose?: MongooseCache;
};

const cached: MongooseCache = globalForMongoose.mongoose ?? {
  conn: null,
  promise: null,
};

// Persist the cache on the global object so it survives module reloads in dev.
if (!globalForMongoose.mongoose) {
  globalForMongoose.mongoose = cached;
}

/**
 * Establish (or reuse) a connection to MongoDB via Mongoose.
 *
 * This function is safe to call from both server components and API routes.
 * It returns the active Mongoose connection and guarantees that only a
 * single connection is created per server runtime.
 */
export async function connectToDatabase(): Promise<Connection> {
  if (cached.conn) {
    return cached.conn;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  // If we don't have a promise yet, create one and store it in the cache.
  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoUri, {
      // Add any connection options you want here, for example:
      // maxPoolSize: 10,
      // autoIndex: process.env.NODE_ENV !== 'production',
    });
  }

  const mongooseInstance = await cached.promise;

  // Store the active connection on the cache for future calls.
  cached.conn = mongooseInstance.connection;

  return cached.conn;
}
