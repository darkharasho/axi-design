import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { resolve, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Local preview serves from / while Pages serves from /axi-design/, so the
// site is rebuilt here with AXI_BASE set to the root. Building rather than
// serving _site as-is is deliberate: a preview of a stale build is worse than
// no preview, because it looks like a preview.
process.env.AXI_BASE = '/'
const { build } = await import('./site.mjs')

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, '_site')
build(OUT)

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.txt': 'text/plain', '.svg': 'image/svg+xml' }

createServer((req, res) => {
  let path = resolve(OUT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, ''))
  if (!path.startsWith(OUT)) { res.writeHead(403).end(); return }
  if (existsSync(path) && statSync(path).isDirectory()) path = resolve(path, 'index.html')
  if (!existsSync(path)) { res.writeHead(404).end('not found'); return }
  res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' })
  res.end(readFileSync(path))
}).listen(4173, () => console.log('axi-design docs on http://localhost:4173'))
