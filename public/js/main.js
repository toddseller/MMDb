// @ts-check
// The one module with side effects: it starts each feature. Modules run after the page is parsed, so no ready handler.
import { init as initCredits } from '#mmdb/credits.js'
import { init as initDrawer } from '#mmdb/drawer.js'
import { init as initFilters } from '#mmdb/filters.js'
import { init as initPreview } from '#mmdb/preview.js'

initCredits(document)
initDrawer(document)
initFilters(document)
initPreview(document)
