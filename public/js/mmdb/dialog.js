// @ts-check
import { on } from '#mmdb/events.js'

/** @param {Document} document @param {string} id */
const find = (document, id) => /** @type {HTMLDialogElement} */ (document.getElementById(id))

/**
 * The fade's own animations: the dialog's, its backdrop's (which only the subtree lists) and its sliding box's. Not
 * the rest of the subtree: a focused field's transition, or a spinner that never ends, would hold the close.
 * @param {HTMLDialogElement} dialog
 */
const fades = (dialog) => {
  const own = [dialog, dialog.querySelector('.modal-dialog')]
  return dialog.getAnimations({ subtree: true }).filter((animation) => own.includes(/** @type {KeyframeEffect | null} */ (animation.effect)?.target ?? null))
}

/**
 * The stylesheet fades a `.closing` dialog out; the browser would drop it from view at once, so it closes once the
 * fade has run. With reduced motion nothing animates and it closes straight away.
 * @param {HTMLDialogElement} dialog
 */
const fadeOut = async (dialog) => {
  if (!dialog.open) return
  dialog.classList.add('closing')
  // Settled, not all: reopening cancels the fade, and a cancelled animation's finished rejects.
  await Promise.allSettled(fades(dialog).map((animation) => animation.finished))
  if (dialog.classList.contains('closing')) dialog.close()
}

/** @param {Document} document @param {string} id */
export const open = (document, id) => {
  const dialog = find(document, id)
  dialog.classList.remove('closing')
  if (!dialog.open) dialog.showModal()
}

/** @param {Document} document @param {string} id */
export const close = (document, id) => fadeOut(find(document, id))

/** @param {Document} document */
export const init = (document) => {
  // cancel and close don't bubble, but listeners on the way down still hear them.
  document.addEventListener('cancel', (event) => {
    const dialog = /** @type {Element} */ (event.target)
    // A file input's picker fires its own cancel.
    if (!dialog.matches('dialog.modal')) return
    event.preventDefault()
    fadeOut(/** @type {HTMLDialogElement} */ (dialog))
  }, true)
  document.addEventListener('close', (event) => /** @type {Element} */ (event.target).classList.remove('closing'), true)
  on(document, 'click', '[data-close]', (_event, button) => {
    const dialog = button.closest('dialog')
    if (dialog) fadeOut(dialog)
  })
}
