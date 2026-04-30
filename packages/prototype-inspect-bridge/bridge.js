/**
 * Prototype inspect bridge — paste or bundle in dev only.
 * Registry: window.__PROTOTYPE_INSPECT_REGISTRY__ = { sectionId: () => HTMLElement | null }
 * Optional: window.__PROTOTYPE_INSPECT_PARENT_ORIGIN__ = 'http://localhost:5174'
 */
(function () {
  var ATTR = 'data-prototype-inspect-highlight';

  function clearHighlights() {
    document.querySelectorAll('[' + ATTR + ']').forEach(function (el) {
      el.removeAttribute(ATTR);
      el.style.outline = '';
      el.style.outlineOffset = '';
      el.style.scrollMarginTop = '';
    });
  }

  function applyHighlight(sections) {
    clearHighlights();
    var reg = window.__PROTOTYPE_INSPECT_REGISTRY__;
    if (!reg || typeof reg !== 'object') return;
    (sections || []).forEach(function (id) {
      var fn = reg[id];
      if (typeof fn !== 'function') return;
      var el = fn();
      if (!el || !(el instanceof Element)) return;
      el.setAttribute(ATTR, '1');
      el.style.outline = '3px solid #0056d2';
      el.style.outlineOffset = '2px';
      el.style.scrollMarginTop = '6rem';
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (e) {
        el.scrollIntoView(true);
      }
    });
  }

  window.addEventListener('message', function (ev) {
    var allowed = window.__PROTOTYPE_INSPECT_PARENT_ORIGIN__;
    if (allowed && ev.origin !== allowed) return;
    var d = ev.data;
    if (!d || typeof d !== 'object') return;
    if (d.type === 'PROTOTYPE_INSPECT_CLEAR') {
      clearHighlights();
      return;
    }
    if (d.type === 'PROTOTYPE_INSPECT_HIGHLIGHT' && Array.isArray(d.sections)) {
      applyHighlight(d.sections);
    }
  });
})();
