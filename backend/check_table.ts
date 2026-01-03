import { query, connectDB } from './src/config/database';

async function checkTable() {
  await connectDB();
  try {
    console.log('✅ PostgreSQL connected');
    
    // Check if daily_work_logs table exists
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'daily_work_logs'
      ) AS table_exists;
    `);
    
    console.log('Table exists:', tableCheck.rows[0].table_exists);
    
    if (tableCheck.rows[0].table_exists) {
      // Get table structure
      const columns = await query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'daily_work_logs'
        ORDER BY ordinal_position;
      `);
      
      console.log('\nTable structure:');
      console.log('-----------------');
      columns.rows.forEach(row => {
        console.log(`${row.column_name}: ${row.data_type}, nullable: ${row.is_nullable}, default: ${row.column_default}`);
      });
      
      // Test a simple query
      const testQuery = await query('SELECT * FROM daily_work_logs LIMIT 1;');
      console.log('\nSample record:', testQuery.rows.length > 0 ? testQuery.rows[0] : 'No records found');
    } else {
      console.log('\nTable "daily_work_logs" does not exist!');
    }
  } catch (error) {
    console.error('Error checking table:', error);
  } finally {
    process.exit(0);
  }
}

checkTable();