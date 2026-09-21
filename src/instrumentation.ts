export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getBoss } = await import('@/lib/queue');
    const boss = await getBoss();
    
    // Register background workers
    const { processPdfGeneration } = await import('@/lib/queue/workers/pdf-worker');
    
    // Ensure queue exists before registering worker
    await boss.createQueue('generate-pdf');
    await boss.work('generate-pdf', processPdfGeneration);
    
    console.log('[pg-boss] Started and registered workers.');
  }
}
