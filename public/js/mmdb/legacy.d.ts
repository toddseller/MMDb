// State the modules share with code still in public/js/mmdb.js. Each piece that takes one over deletes its line.
interface Window {
  // Read by the jQuery edit, delete and actor-search code (pieces 2 to 4).
  filterValue: string
  // The details drawer, still jQuery until piece 2.
  drawer: { close: (instant?: boolean) => void }
}
