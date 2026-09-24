## Use it

On the web, link the published file:

```html
<link rel="stylesheet" href="https://darkharasho.github.io/axi-design/v1/axi.css">
```

In an app that bundles — anything on Vite, and every Electron app in the suite
— install it and import the stylesheet instead:

```bash
npm install @axiapps/axi-design
```

```js
import '@axiapps/axi-design/axi.css'
```

There is a third case: an app that already draws its own components through
its own CSS variables, and wants to point them at ours rather than be
rewritten. That app wants the palette without the components:

```js
import '@axiapps/axi-design/tokens.css'
```

`--bg-card: var(--axi-surface)` and the like is then the whole port, and the
values can never drift — which is what happens the moment the token block is
copied into the consumer by hand.

The two are not interchangeable. A `<link>` to the Pages URL is a network
request at load, which is correct for a site and wrong for a desktop app: an
Electron window opened offline renders unstyled, and one opened online pays a
round-trip before it can paint. Bundling resolves the file at build time, so
the app ships with it.

## Set your accent

Either way, set your accent:

```css
:root { --axi-accent: #b06bff; }
```

That is the whole theming surface. See [Theming](../theming/) for the token
layers underneath it, and [Components](../components/) for every component
with a live accent switcher.
