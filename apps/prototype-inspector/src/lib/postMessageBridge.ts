const ORIGINS = ['*'] as const;

export type HighlightPayload = {
  type: 'PROTOTYPE_INSPECT_HIGHLIGHT';
  sections: string[];
};

export type ClearPayload = {
  type: 'PROTOTYPE_INSPECT_CLEAR';
};

export function postHighlightToPrototype(win: Window | null, sections: string[]) {
  if (!win) return;
  const msg: HighlightPayload = {
    type: 'PROTOTYPE_INSPECT_HIGHLIGHT',
    sections,
  };
  for (const origin of ORIGINS) {
    try {
      win.postMessage(msg, origin);
    } catch {
      /* ignore */
    }
  }
}

export function postClearToPrototype(win: Window | null) {
  if (!win) return;
  const msg: ClearPayload = { type: 'PROTOTYPE_INSPECT_CLEAR' };
  for (const origin of ORIGINS) {
    try {
      win.postMessage(msg, origin);
    } catch {
      /* ignore */
    }
  }
}
