import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'aiasist_db',
  password: 'omercan095211',
  port: 5432,
});

export default pool;
