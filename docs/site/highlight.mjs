const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }

export function escapeHtml(source) {
  return String(source).replace(/[&<>"]/g, (ch) => ESCAPES[ch])
}

const ATTR = /(\s*)([a-zA-Z_:][\w:.-]*)(?:(\s*=\s*)("[^"]*"|'[^']*'))?/g

// A build-time tokeniser for HTML, and only HTML - the one language the
// samples are written in. A Prism or Shiki dependency would buy support for
// languages that never appear here, and would make every visitor pay at
// runtime for a transform that can happen once, here.
//
// The invariant, pinned by the round-trip test: every character of the input
// reaches the output exactly once, escaped. Highlighting may add spans; it may
// never add, drop or reorder source text. A `>` inside an attribute value
// would break the tag scan, so it is left unhighlighted as plain text rather
// than mis-parsed - the round-trip still holds.
export function highlight(source) {
  let out = ''
  let i = 0
  const text = (s) => { out += escapeHtml(s) }
  const span = (cls, s) => { out += `<span class="${cls}">${escapeHtml(s)}</span>` }

  while (i < source.length) {
    const lt = source.indexOf('<', i)
    if (lt === -1) { text(source.slice(i)); break }
    if (lt > i) text(source.slice(i, lt))

    const gt = source.indexOf('>', lt)
    const inner = gt === -1 ? null : source.slice(lt + 1, gt)
    const head = inner && inner.match(/^(\/?)([a-zA-Z][\w-]*)([\s\S]*)$/)
    if (!head) { text(source.slice(lt, lt + 1)); i = lt + 1; continue }

    const [, slash, name, rest] = head
    span('t-punc', `<${slash}`)
    span('t-tag', name)

    ATTR.lastIndex = 0
    let cursor = 0
    let match
    while ((match = ATTR.exec(rest)) !== null) {
      if (match[0] === '') { ATTR.lastIndex += 1; continue }
      if (match.index > cursor) text(rest.slice(cursor, match.index))
      text(match[1])
      span('t-attr', match[2])
      if (match[3]) span('t-punc', match[3])
      if (match[4]) span('t-str', match[4])
      cursor = ATTR.lastIndex
    }
    if (cursor < rest.length) {
      const tail = rest.slice(cursor)
      const selfClosing = tail.match(/^(\s*)(\/)$/)
      if (selfClosing) { text(selfClosing[1]); span('t-punc', '/') } else text(tail)
    }

    span('t-punc', '>')
    i = gt + 1
  }
  return out
}
