// What the modules still borrow from the jQuery page, all through bootstrap.js. Change 7 deletes it.
interface Window {
  $: (selector: string) => {
    modal: (action: 'show' | 'hide') => void
    on: (type: 'shown.bs.modal' | 'hidden.bs.modal', handler: (event: { currentTarget: HTMLElement }) => void) => void
  }
}
