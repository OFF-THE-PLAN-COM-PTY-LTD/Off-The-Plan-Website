"""Quick diagnostic — prints all links found on the news page after JS renders."""
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        print("Loading page...")
        await page.goto("https://offtheplan.com.au/news", wait_until="networkidle", timeout=30000)

        # Extra wait for JS templates
        await page.wait_for_timeout(3000)

        # Scroll to trigger lazy load
        for _ in range(6):
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await page.wait_for_timeout(1500)

        # Get all hrefs
        links = await page.eval_on_selector_all("a[href]", "els => els.map(e => e.href)")

        print(f"\nAll links found ({len(links)} total):")
        seen = set()
        for link in sorted(links):
            if link not in seen and "offtheplan.com.au" in link:
                seen.add(link)
                print(" ", link)

        await browser.close()

asyncio.run(main())
