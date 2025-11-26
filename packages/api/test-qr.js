// Quick test script to verify QR code generation with logo
import { generateQRCodeWithLogo } from './src/utils/qrcode.js';
import { writeFileSync } from 'fs';

async function test() {
  try {
    console.log('Testing QR code generation with logo...');
    console.log('Current directory:', process.cwd());
    
    const qrDataURL = await generateQRCodeWithLogo('https://example.com/test', {
      width: 512,
      margin: 2,
      logoSize: 100,
      logoPath: 'public/logo.jpg'
    });
    
    // Save to file for inspection
    const base64Data = qrDataURL.replace(/^data:image\/png;base64,/, '');
    writeFileSync('test-qr.png', Buffer.from(base64Data, 'base64'));
    
    console.log('✅ QR code generated successfully!');
    console.log('📄 Saved to test-qr.png');
    console.log('QR data URL length:', qrDataURL.length);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

test();
