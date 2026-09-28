// What each drawing is *for*, which the drawing itself cannot say. The
// categories live here rather than in a directory tree so a re-categorisation
// is an edit to this file, not a rename that breaks every consumer's <use>.
// `aliases` carries the word a person might reach for instead of the name -
// Lucide's name is the id, and nothing in the set is renamed to be findable.
export const ICON_ENTRIES = [
  { name: 'check', categories: ['status'], aliases: ['tick', 'done'], keywords: ['confirm', 'success', 'ok'] },
  { name: 'chevron-down', categories: ['navigation'], aliases: ['caret-down'], keywords: ['expand', 'open', 'more'] },
  { name: 'chevron-right', categories: ['navigation'], aliases: ['caret-right'], keywords: ['next', 'forward', 'breadcrumb'] },
  { name: 'circle-alert', categories: ['status'], aliases: ['alert', 'warning', 'exclamation'], keywords: ['danger', 'error', 'caution'] },
  { name: 'folder', categories: ['files'], aliases: ['directory'], keywords: ['file', 'group'] },
  { name: 'info', categories: ['status'], aliases: ['about'], keywords: ['note', 'meta', 'help'] },
  { name: 'plus', categories: ['actions'], aliases: ['add', 'new'], keywords: ['create', 'insert'] },
  { name: 'search', categories: ['actions'], aliases: ['magnifier', 'find'], keywords: ['filter', 'lookup', 'query'] },
  { name: 'trash-2', categories: ['actions'], aliases: ['delete', 'bin', 'remove'], keywords: ['destroy', 'discard'] },
  { name: 'x', categories: ['actions'], aliases: ['close', 'dismiss', 'cancel'], keywords: ['exit', 'clear'] },
]
