// @ts-check
// The one module with side effects: it starts each feature. Modules run after the page is parsed, so no ready handler.
import { init as initFilters } from '#mmdb/filters.js'

initFilters(document)
