import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
  const sql = neon(process.env.DATABASE_CONNECTION_STRING);
  try {
    const userDuplicates = await sql`SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1`;
    console.log('User Duplicates (email):', userDuplicates);
    
    const courseDuplicates = await sql`SELECT "courseId", COUNT(*) FROM study_material GROUP BY "courseId" HAVING COUNT(*) > 1`;
    console.log('Course Duplicates (courseId):', courseDuplicates);
  } catch(e) {
    console.error(e);
  }
}
check();
