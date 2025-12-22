import fs from 'fs';
import path from 'path';
import playwright from 'playwright';

const url = 'http://localhost:3000';
const outDir = path.resolve(process.cwd(), 'scripts', 'screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const viewports = [
  { name: 'narrow', width: 375, height: 800 },
  { name: 'medium', width: 768, height: 1024 },
  { name: 'wide', width: 1280, height: 900 },
];

(async () => {
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  for (const vp of viewports) {
    console.log('Testing viewport', vp.name, vp.width);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600); // allow scripts to stabilize

    // If the identification overlay is present, fill the phone input and submit
    try {
      const phoneInput = await page.$('input[type="tel"]');
      const submitBtn = await page.$('button[type="submit"]');
      if (phoneInput && submitBtn) {
        await phoneInput.fill('0000000000');
        await submitBtn.click({ force: true });
        await page.waitForTimeout(800); // allow overlay to update
        const stillPresent = await page.$('input[type="tel"]');
        console.log('Identification overlay present after submit:', Boolean(stillPresent));
      }
    } catch (e) {
      console.log('Identification fill skipped:', e && e.message);
    }

    // Ensure the FAQ tab is clicked to mount the widget
    try {
      const faqTab = await page.$('.faq-tab');
      if (faqTab) {
        const box = await faqTab.boundingBox();
        const visible = await faqTab.isVisible();
        console.log('FAQ tab present:', Boolean(faqTab), 'visible:', visible, 'box:', box);
        // Try both element click and DOM click dispatch to ensure React handler runs
        await faqTab.click({ force: true });
        await page.evaluate(() => {
          const el = document.querySelector('.faq-tab');
          if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        });
        // Also try keyboard activation
        try {
          await faqTab.focus();
          await page.keyboard.press('Enter');
        } catch {}
        await page.waitForTimeout(600);
      } else {
        console.log('FAQ tab not present in DOM');
      }

      // Check whether the FAQ dialog rendered
      const dialog = await page.$('[role="dialog"][aria-label="FAQ widget"]');
      console.log('FAQ dialog present after click:', Boolean(dialog));
      if (dialog) {
        const html = await page.evaluate((d) => d.outerHTML, dialog);
        console.log('Dialog snippet:', html.slice(0, 400));

        // Run layout measurements similar to updateConstrainedSizesAndSide
        try {
          const metrics = await page.evaluate(() => {
            const mainEl = document.querySelector('main');
            const dialog = document.querySelector('[role="dialog"][aria-label="FAQ widget"]');
            if (!dialog || !mainEl) return null;

            // find container ancestor with --desc variable
            let ancestor = dialog;
            let container = null;
            while (ancestor) {
              const cs = getComputedStyle(ancestor);
              if (cs && cs.getPropertyValue('--desc')) {
                container = ancestor;
                break;
              }
              ancestor = ancestor.parentElement;
            }
            if (!container) return null;

            const mainRect = mainEl.getBoundingClientRect();
            const rect = container.getBoundingClientRect();
            const cs = getComputedStyle(container);
            const padLeft = Math.max(0, parseFloat(cs.paddingLeft || '0'));
            const padRight = Math.max(0, parseFloat(cs.paddingRight || '0'));
            const gap = parseFloat(cs.getPropertyValue('--gap')) || 8;
            const circle = parseFloat(cs.getPropertyValue('--circle')) || 200;
            const desc = parseFloat(cs.getPropertyValue('--desc')) || 170;
            const safetyBuffer = 8;

            const availableRight = Math.floor(mainRect.right - (rect.left + circle + gap + padRight) - safetyBuffer);
            const availableLeft = Math.floor((rect.left - mainRect.left) - (gap + padLeft) - safetyBuffer);

            const preferRightBias = 12;

            const chosenSide = availableRight >= Math.max(120, desc) ? 'right' : (availableLeft >= Math.max(120, desc) && availableLeft > availableRight + preferRightBias ? 'left' : (availableRight >= availableLeft + preferRightBias ? 'right' : 'right'));

            const sideAvailable = chosenSide === 'right' ? availableRight : availableLeft;
            const sideCoverage = sideAvailable / Math.max(1, desc);

            return {
              mainRect: { w: mainRect.width, left: mainRect.left, right: mainRect.right },
              containerRect: { left: rect.left, right: rect.right, width: rect.width },
              circle,
              gap,
              desc,
              availableRight,
              availableLeft,
              chosenSide,
              sideAvailable,
              sideCoverage,
            };
          });
          console.log('Layout metrics:', metrics);
        } catch (e) {
          console.log('Measurement failed:', e && e.message);
        }

        // try to find a cube button inside dialog using aria-label
        try {
          const cubeByAria = await dialog.$('button[aria-label]');
          if (cubeByAria) {
            // Inspect attributes & computed styles for diagnostics
            const info = await page.evaluate((el) => {
              const rect = el.getBoundingClientRect();
              const cs = window.getComputedStyle(el);
              return {
                aria: el.getAttribute('aria-label'),
                dataNoDrag: el.getAttribute('data-no-drag'),
                disabled: el.getAttribute('disabled'),
                rect,
                pointerEvents: cs.pointerEvents,
                display: cs.display,
                visibility: cs.visibility,
                opacity: cs.opacity,
              };
            }, cubeByAria);

            console.log('Cube info:', info);

            // Try keyboard activation first
            try {
              await cubeByAria.focus();
              await page.keyboard.press('Enter');
            } catch {}

            // Attempt a real pointer click at the center of the cube
            const box = await cubeByAria.boundingBox();
            if (box) {
              const cx = box.x + box.width / 2;
              const cy = box.y + box.height / 2;
              await page.mouse.move(cx, cy);
              await page.mouse.down();
              await page.mouse.up();
            } else {
              await cubeByAria.click({ force: true });
            }

            // wait for either inline desc or overlay to appear
            try {
              await page.waitForSelector('.desc, .overlayBackdrop', { timeout: 1500 });
            } catch {}
            const descAfter = await page.$('.desc');
            const overlayAfter = await page.$('.overlayBackdrop');
            console.log('desc present after cube click:', Boolean(descAfter), 'overlay present:', Boolean(overlayAfter));
          }
        } catch (e) {
          console.log('Could not click cube by aria:', e && e.message);
        }
      }
    } catch (e) {
      console.log('Could not click FAQ tab:', e && e.message);
    }
    // Capture baseline
    await page.screenshot({ path: path.join(outDir, `page-${vp.name}.png`), fullPage: true });

    // Try to click first cube to open description
    try {
      // wait briefly for the widget to mount
      await page.waitForTimeout(800);
      const widgetExists = await page.$('.container');
      if (!widgetExists) {
        console.log('Widget not found after clicking FAQ tab');
      }
      const cube = await page.$('.cubeBtn');
      if (cube) {
        await cube.click({ force: true });
        await page.waitForTimeout(300);
        // Wait for either inline desc or overlay
        const desc = await page.$('.desc');
        const overlay = await page.$('.overlayBackdrop');
        if (overlay) {
          await page.screenshot({ path: path.join(outDir, `overlay-${vp.name}.png`), fullPage: false });
        }
        if (desc) {
          // scroll into view and screenshot just the widget area
          const widget = await page.$('.container');
          if (widget) {
            const clip = await widget.boundingBox();
            if (clip) {
              await page.screenshot({ path: path.join(outDir, `inline-${vp.name}.png`), clip });
            } else {
              await page.screenshot({ path: path.join(outDir, `inline-${vp.name}.png`) });
            }
          }
        }
      } else {
        console.log('No cube found');
      }
    } catch (e) {
      console.log('Interaction error:', e && e.message);
    }

    // Close any overlay if present
    try {
      const close = await page.$('.overlayClose');
      if (close) {
        await close.click({ force: true });
        await page.waitForTimeout(200);
      }
    } catch {}
  }

  await browser.close();
  console.log('Screenshots saved to', outDir);
})();