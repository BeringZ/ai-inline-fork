import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1280, height: 800 },
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
});

// Try navigating to different paths to see what's accessible
const paths = ['/', '/chat', '/chat/new', '/?show=chat'];
for (const path of paths) {
  try {
    console.log(`\n=== Trying ${path} ===`);
    await page.goto(`https://chat.deepseek.com${path}`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000);
    console.log('URL:', page.url());

    const info = await page.evaluate(() => {
      const root = document.getElementById('root');
      const text = root?.textContent?.trim().slice(0, 300) || '';
      const html = root?.innerHTML?.slice(0, 500) || '';

      const buttons = Array.from(document.querySelectorAll('button')).map(b => ({
        text: b.textContent?.trim().slice(0, 30),
        class: b.className?.slice(0, 80),
      })).slice(0, 10);

      const inputs = Array.from(document.querySelectorAll('textarea, [contenteditable="true"], input:not([type="hidden"])')).map(el => ({
        tag: el.tagName,
        type: el.getAttribute('type') || '',
        placeholder: el.getAttribute('placeholder') || '',
        class: el.className?.slice(0, 80),
      }));

      return { textPreview: text, buttons, inputs, hasChat: text.includes('DeepSeek') || text.length > 200 };
    });

    console.log('Preview:', info.textPreview);
    console.log('Buttons:', JSON.stringify(info.buttons));
    console.log('Inputs:', JSON.stringify(info.inputs));
  } catch (e) {
    console.log('Error:', e.message.slice(0, 100));
  }
}

await browser.close();
