// The inverse of highlight(), for tests only. It lives here rather than beside
// highlight() because nothing the site ships needs to undo its own syntax
// highlighting - exporting it from production code would invent a use it does
// not have. Not named *.test.mjs, so vitest collects it as a module, not a suite.
export const unhighlight = (html) =>
  html.replace(/<\/?span[^>]*>/g, '')
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
