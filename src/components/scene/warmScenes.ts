/**
 * Scene art is lazy-loaded, so the first visit only pays for the hero. Left at that, each scene would download and
 * decode its big layers right as you scroll into it, which is exactly when a decode stutters the scroll. So once the
 * page has loaded, the remaining scenes are fetched and decoded in page order, one image at a time, during idle time.
 */
const queue = new Set<HTMLElement>();
const done = new WeakSet<HTMLElement>();
let started = false;
let running = false;
let ready = false; // the page has finished loading

const idle = () =>
  new Promise<void>((r) => ("requestIdleCallback" in window ? requestIdleCallback(() => r(), { timeout: 1500 }) : setTimeout(r, 200)));

async function run() {
  if (running) return;
  running = true;
  // document order: the next scene down the page warms first; scenes that mount later join the queue
  for (;;) {
    const el = [...queue].filter((e) => !done.has(e)).sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))[0];
    if (!el) break;
    done.add(el);
    if (!el.isConnected) continue;
    for (const img of el.querySelectorAll("img")) {
      await idle();
      img.loading = "eager";
      await img.decode().catch(() => {}); // decodes off the main thread; a failed or hidden image is fine
    }
  }
  running = false;
}

export function warmLater(el: HTMLElement) {
  queue.add(el);
  if (started) {
    if (ready) void run(); // already going (or finished): pick this one up too
    return;
  }
  started = true;
  const go = () => {
    ready = true;
    void idle().then(run);
  };
  if (document.readyState === "complete") go();
  else window.addEventListener("load", go, { once: true });
}

export function unwarm(el: HTMLElement) {
  queue.delete(el);
}
