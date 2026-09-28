// What each drawing is *for*, which the drawing itself cannot say. The
// categories live here rather than in a directory tree so a re-categorisation
// is an edit to this file, not a rename that breaks every consumer's <use>.
// `aliases` carries the word a person might reach for instead of the name -
// Lucide's name is the id, and nothing in the set is renamed to be findable.
// `lucide` is a different thing: the other *Lucide component names* that land
// on this drawing - a deprecated spelling, or a metaphor this grammar draws
// with a shape it already has. Those go in the sprite as real symbols, so an
// app porting off lucide-react can rewrite the name and stop. Search words do
// not; `done` and `back` are not API.
export const ICON_ENTRIES = [
  { name: 'arrow-down', categories: ['navigation'], aliases: ['down'], keywords: ['descend', 'sort', 'below'] },
  { name: 'arrow-left', categories: ['navigation'], aliases: ['back'], keywords: ['previous', 'return', 'west'] },
  { name: 'arrow-right', categories: ['navigation'], aliases: ['forward'], keywords: ['next', 'proceed', 'east'] },
  { name: 'arrow-up', categories: ['navigation'], aliases: ['up'], keywords: ['ascend', 'sort', 'above'] },
  { name: 'calendar', categories: ['objects'], aliases: ['date', 'schedule'], keywords: ['day', 'month', 'event'] },
  { name: 'check', categories: ['status'], aliases: ['tick', 'done'], keywords: ['confirm', 'success', 'ok'] },
  { name: 'check-check', categories: ['actions'], aliases: ['done-all'], keywords: ['read', 'confirmed', 'both'] },
  { name: 'chevron-down', categories: ['navigation'], aliases: ['caret-down'], keywords: ['expand', 'open', 'more'] },
  { name: 'chevron-left', categories: ['navigation'], aliases: ['caret-left'], keywords: ['back', 'previous', 'collapse'] },
  { name: 'chevron-right', categories: ['navigation'], aliases: ['caret-right'], keywords: ['next', 'forward', 'breadcrumb'] },
  { name: 'chevron-up', categories: ['navigation'], aliases: ['caret-up'], keywords: ['collapse', 'close', 'less'] },
  { name: 'circle-alert', categories: ['status'], aliases: ['alert', 'warning', 'exclamation'], lucide: ['alert-circle', 'triangle-alert', 'alert-triangle'], keywords: ['danger', 'error', 'caution'] },
  { name: 'circle-check', categories: ['status'], aliases: ['success'], lucide: ['check-circle', 'check-circle-2'], keywords: ['verified', 'passed', 'complete'] },
  { name: 'circle-x', categories: ['status'], aliases: ['failure'], lucide: ['x-circle'], keywords: ['error', 'rejected', 'failed'] },
  { name: 'crown', categories: ['objects'], aliases: ['king', 'best'], keywords: ['rank', 'premium', 'featured', 'top'] },
  { name: 'clock', categories: ['objects'], aliases: ['time'], keywords: ['duration', 'schedule', 'recent'] },
  { name: 'copy', categories: ['files'], aliases: ['duplicate'], keywords: ['clipboard', 'clone'] },
  { name: 'download', categories: ['files'], aliases: ['save-to-disk'], keywords: ['export', 'fetch', 'pull'] },
  { name: 'external-link', categories: ['navigation'], aliases: ['open-in-new'], keywords: ['outbound', 'away', 'launch'] },
  { name: 'eye', categories: ['status'], aliases: ['visible', 'view'], keywords: ['preview', 'watch', 'show'] },
  { name: 'file', categories: ['files'], aliases: ['document'], keywords: ['sheet', 'page', 'blank'] },
  { name: 'file-text', categories: ['files'], aliases: ['document-text'], keywords: ['note', 'report', 'contents'] },
  { name: 'filter', categories: ['actions'], aliases: ['funnel'], keywords: ['narrow', 'refine', 'query'] },
  { name: 'folder', categories: ['files'], aliases: ['directory'], keywords: ['file', 'group'] },
  { name: 'folder-open', categories: ['files'], aliases: ['directory-open'], keywords: ['expanded', 'browse', 'contents'] },
  { name: 'info', categories: ['status'], aliases: ['about'], keywords: ['note', 'meta', 'help'] },
  { name: 'link', categories: ['actions'], aliases: ['chain'], keywords: ['url', 'anchor', 'connect'] },
  { name: 'loader-circle', categories: ['status'], aliases: ['spinner', 'loading'], lucide: ['loader-2'], keywords: ['busy', 'pending', 'wait', 'progress'] },
  { name: 'lock', categories: ['objects'], aliases: ['locked', 'secure'], keywords: ['private', 'password', 'closed'] },
  { name: 'maximize-2', categories: ['actions'], aliases: ['expand', 'fullscreen'], keywords: ['enlarge', 'grow', 'open'] },
  { name: 'menu', categories: ['navigation'], aliases: ['hamburger'], keywords: ['nav', 'list', 'more'] },
  { name: 'message-square', categories: ['objects'], aliases: ['comment', 'chat'], keywords: ['speech', 'reply', 'thread', 'note'] },
  { name: 'minus', categories: ['actions'], aliases: ['subtract', 'remove'], keywords: ['collapse', 'less'] },
  { name: 'pause', categories: ['media'], aliases: ['halt'], keywords: ['suspend', 'hold'] },
  { name: 'pencil', categories: ['actions'], aliases: ['edit', 'write'], lucide: ['edit-2', 'square-pen'], keywords: ['rename', 'modify', 'compose'] },
  { name: 'play', categories: ['media'], aliases: ['start'], keywords: ['run', 'resume', 'begin'] },
  { name: 'plus', categories: ['actions'], aliases: ['add', 'new'], keywords: ['create', 'insert'] },
  { name: 'refresh-cw', categories: ['actions'], aliases: ['reload', 'sync'], keywords: ['retry', 'refetch', 'again'] },
  { name: 'save', categories: ['files'], aliases: ['diskette'], keywords: ['store', 'persist', 'write'] },
  { name: 'search', categories: ['actions'], aliases: ['magnifier', 'find'], keywords: ['filter', 'lookup', 'query'] },
  { name: 'settings-2', categories: ['actions'], aliases: ['sliders', 'preferences'], keywords: ['options', 'config', 'tune'] },
  { name: 'shield', categories: ['status'], aliases: ['secure', 'protected'], keywords: ['guard', 'safety', 'defence', 'trust'] },
  { name: 'skip-forward', categories: ['media'], aliases: ['next-track'], keywords: ['forward', 'advance'] },
  { name: 'square', categories: ['media'], aliases: ['stop'], lucide: ['circle'], keywords: ['halt', 'end', 'record'] },
  { name: 'tag', categories: ['objects'], aliases: ['label'], keywords: ['category', 'badge', 'marker'] },
  { name: 'trash-2', categories: ['actions'], aliases: ['delete', 'bin'], keywords: ['destroy', 'discard', 'remove'] },
  { name: 'unlock', categories: ['objects'], aliases: ['unlocked'], keywords: ['open', 'public', 'granted'] },
  { name: 'upload', categories: ['files'], aliases: ['send'], keywords: ['import', 'push', 'attach'] },
  { name: 'user', categories: ['objects'], aliases: ['person', 'account'], keywords: ['profile', 'member', 'who'] },
  { name: 'users', categories: ['objects'], aliases: ['people', 'group'], keywords: ['team', 'members', 'roster'] },
  { name: 'volume-2', categories: ['media'], aliases: ['sound', 'audio'], keywords: ['speaker', 'loud', 'unmute'] },
  { name: 'x', categories: ['actions'], aliases: ['close', 'dismiss', 'cancel'], keywords: ['exit', 'clear'] },
]
