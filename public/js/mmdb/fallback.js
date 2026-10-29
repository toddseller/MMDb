// @ts-check

/** @param {HTMLImageElement} img */
const useFallback = (img) => {
  const fallback = img.dataset.fallback
  if (!fallback) return
  // Removed first, so a fallback that fails too can't swap again.
  delete img.dataset.fallback
  img.src = fallback
}

/** @param {Document} document */
export const init = (document) => {
  // error doesn't bubble, so the listener catches it on the way down.
  document.addEventListener('error', (event) => {
    const img = /** @type {HTMLImageElement} */ (event.target)
    if (img.tagName === 'IMG') useFallback(img)
  }, true)
  // Modules run after parsing, so an image that failed earlier fired its error before the listener existed.
  document.querySelectorAll('img[data-fallback]').forEach((element) => {
    const img = /** @type {HTMLImageElement} */ (element)
    if (img.complete && img.naturalWidth === 0) useFallback(img)
  })
}
