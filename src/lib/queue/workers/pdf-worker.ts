import puppeteer from 'puppeteer';
import QRCode from 'qrcode';
import { db } from '@/db';
import { documents } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { Job } from 'pg-boss';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function processPdfGeneration(jobs: Job<{ documentId: string }>[]) {
  for (const job of jobs) {
    const { documentId } = job.data;
    
    console.log(`[PDF Worker] Starting PDF generation for document ${documentId}`);

    // 1. Fetch document
    const doc = await db.query.documents.findFirst({
      where: eq(documents.id, documentId)
    });
    if (!doc) throw new Error("Document not found");

    // 2. Generate QR code (URL to verify document)
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify/${doc.id}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 1,
      width: 150
    });

    // 3. Construct HTML Content for Puppeteer
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${doc.subject}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 40px; 
              line-height: 1.5;
              color: #000;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .qr-code { 
              float: right; 
              width: 100px; 
              height: 100px; 
              margin-left: 20px;
              margin-bottom: 20px;
            }
            .meta-table {
              width: 100%;
              margin-bottom: 30px;
            }
            .meta-table td {
              vertical-align: top;
            }
            .content {
              clear: both;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${doc.documentType.replace('_', ' ')}</h2>
          </div>
          <img src="${qrDataUrl}" class="qr-code" alt="Verification QR Code" />
          <table class="meta-table">
            <tr>
              <td width="150"><strong>Number</strong></td>
              <td>: ${doc.documentNumber || 'DRAFT'}</td>
            </tr>
            <tr>
              <td><strong>Subject</strong></td>
              <td>: ${doc.subject}</td>
            </tr>
            <tr>
              <td><strong>Security</strong></td>
              <td>: ${doc.securityLevel}</td>
            </tr>
          </table>
          <div class="content">
            ${doc.bodyHtml}
          </div>
        </body>
      </html>
    `;

    // 4. Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });
    
    try {
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'load' });
      
      // In memory buffer
      const pdfBuffer = await page.pdf({ 
        format: 'A4',
        margin: { top: '2cm', bottom: '2cm', left: '2cm', right: '2cm' },
        printBackground: true
      });
      
      // 5. Hash and Upload to Supabase Storage
      const finalPdfPath = `documents/${doc.id}.pdf`;
      
      // Hash for integrity
      const hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
      
      // Upload to Supabase Storage
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { error } = await supabase.storage
          .from('documents')
          .upload(finalPdfPath, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true
          });
          
        if (error) {
          throw new Error(`Failed to upload to Supabase: ${error.message}`);
        }
      } else {
        console.warn('[PDF Worker] Skipping Supabase upload because credentials are missing');
      }
      
      await db.update(documents)
        .set({ finalPdfPath, sha256Hash: hash })
        .where(eq(documents.id, documentId));
        
      console.log(`[PDF Worker] Successfully generated PDF for ${documentId}`);
    } finally {
      await browser.close();
    }
  }
}
