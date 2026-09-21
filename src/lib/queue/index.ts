import { PgBoss } from 'pg-boss';

let boss: PgBoss | null = null;

export async function getBoss(): Promise<PgBoss> {
  if (boss) return boss;
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  boss = new PgBoss(process.env.DATABASE_URL);
  
  boss.on('error', (error: Error) => console.error('pg-boss error:', error));

  await boss.start();
  
  return boss;
}
