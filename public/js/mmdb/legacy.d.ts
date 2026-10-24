// State the modules share with code still in public/js/mmdb.js. Each piece that takes one over deletes its line.
interface Window {
  // Read by the jQuery edit and delete code (pieces 4 and 5).
  filterValue: string
  // Lent by drawer.js to the jQuery movie edit, delete and season code until pieces 4 and 5 import it.
  drawer: { open: (tile: HTMLElement, html: string, instant?: boolean) => void, close: (instant?: boolean) => void, readonly tile: HTMLElement | null }
}
