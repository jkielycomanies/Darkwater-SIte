import { MongoClient } from 'mongodb';

// Ensure environment variables are loaded
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://jkiely2025:IDKLOL@cluster0.jxle3wm.mongodb.net/darkwater-pos?retryWrites=true&w=majority&ssl=true&tls=true&tlsAllowInvalidCertificates=true&tlsAllowInvalidHostnames=true';

if (!MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = MONGODB_URI;
const options = {
  // Increased connection pool for better performance
  maxPoolSize: 50,
  minPoolSize: 5,
  
  // More aggressive timeouts for better reliability
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 30000,
  connectTimeoutMS: 10000,
  
  // Connection retry settings
  retryWrites: true,
  retryReads: true,
  maxIdleTimeMS: 30000,
  
  // Write concern
  w: 'majority' as const,
  
  // Heartbeat settings
  heartbeatFrequencyMS: 10000,
  
  // Buffer settings
  bufferMaxEntries: 0,
  bufferCommands: false,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Connection retry function
const connectWithRetry = async (uri: string, options: any, retries = 3): Promise<MongoClient> => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = new MongoClient(uri, options);
      await client.connect();
      
      // Test the connection
      await client.db('admin').admin().ping();
      
      console.log('✅ MongoDB connected successfully');
      return client;
    } catch (error) {
      console.error(`❌ MongoDB connection attempt ${i + 1} failed:`, error);
      
      if (i === retries - 1) {
        console.error('🚨 All MongoDB connection attempts failed');
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  throw new Error('Failed to connect to MongoDB after all retries');
};

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    globalWithMongo._mongoClientPromise = connectWithRetry(uri, options);
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  clientPromise = connectWithRetry(uri, options);
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise; 