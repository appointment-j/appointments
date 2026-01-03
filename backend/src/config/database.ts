import { Pool } from 'pg';

let pool: Pool | null = null;

export const connectDB = async (): Promise<void> => {
  try {
    if (!pool) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? {
          rejectUnauthorized: false,
        } : false,
      });

      // Test connection
      const client = await pool.connect();
      console.log('✅ PostgreSQL connected');
      client.release();
    }
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error);
    // In development, allow the server to continue even if DB fails
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  Running in development mode without database');
    } else {
      process.exit(1);
    }
  }
};

export const query = async (text: string, params?: any[]) => {
  if (!pool) {
    // In development without database, return mock results
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  Mock query executed:', text);
      return {
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      };
    }
    throw new Error('Database not connected. Call connectDB() first.');
  }
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

export const getClient = async () => {
  if (!pool) {
    // In development without database, return mock client
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  Mock client connection');
      // Return a mock client object
      return {
        query: async (text: string, params?: any[]) => {
          console.log('⚠️  Mock query executed:', text);
          return {
            rows: [],
            rowCount: 0,
            command: 'SELECT',
            oid: 0,
            fields: []
          };
        },
        release: () => {
          console.log('⚠️  Mock client released');
        }
      };
    }
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return await pool.connect();
};

export const closeDB = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database connection closed');
  }
};
