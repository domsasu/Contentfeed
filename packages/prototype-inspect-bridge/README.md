# prototype-inspect-bridge

Tiny **opt-in** script for a prototype so the **Prototype inspector** iframe can request highlights via `postMessage`.

## Why

The inspector and your app are often **different origins**. The parent page cannot read or modify the iframe DOM. The bridge runs **inside** the prototype and toggles outlines / scroll on elements you register.

## Install

1. Copy `bridge.js` into your prototype (or load from a shared URL during dev).
2. Before `</body>` (or in your app bootstrap in **development** only):

```html
<script src="/path/to/prototype-inspect-bridge.js"></script>
```

3. Register section roots (ids must match `sections` sent from the inspector — see `apps/prototype-inspector/src/lib/fileToSection.ts` in Contentfeed):

```html
<script>
  window.__PROTOTYPE_INSPECT_REGISTRY__ = {
    feed: () => document.getElementById('feed-page-videos'),
    'mini-feed': () => document.querySelector('[aria-label*="career feed" i]'),
    theater: () => document.querySelector('[aria-label="Theater video" i]'),
    home: () => document.getElementById('root'),
  };
</script>
```

Adjust selectors for your DOM. The bridge only uses keys you define.

## Message format

- **Highlight:** `{ type: 'PROTOTYPE_INSPECT_HIGHLIGHT', sections: ['feed', 'mini-feed'] }`
- **Clear:** `{ type: 'PROTOTYPE_INSPECT_CLEAR' }`

Origin filter: set `window.__PROTOTYPE_INSPECT_PARENT_ORIGIN__ = 'http://localhost:5174'` if you want to restrict who can message your page.

## Security

Only load this in **local / preview** builds. Do not ship the bridge to production unless you fully trust the parent origin and harden the registry.
