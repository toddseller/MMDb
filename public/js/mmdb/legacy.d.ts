// What the modules still borrow from the jQuery page. Change 7 deletes it.
interface Window {
  // Bootstrap's modal, for the show edit dialog.
  $: (selector: string) => { modal: (action: 'show' | 'hide') => void }
}
