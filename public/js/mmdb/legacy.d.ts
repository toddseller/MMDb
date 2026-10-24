// State the modules share with code still in public/js/mmdb.js. Each piece that takes one over deletes its line.
interface Window {
  // Lent by drawer.js to the jQuery season default until piece 5 imports it.
  drawer: { readonly tile: HTMLElement | null }
  // Lent by preview.js to the jQuery Create New Show until piece 5 imports it.
  preview: { close: () => void }
}
