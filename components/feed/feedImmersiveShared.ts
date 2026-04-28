import type { FeedPlaceholderItem } from '../../constants/feedCohorts';

export type ImmersiveClip = { item: FeedPlaceholderItem; clipSrc: string };

export function requestElFullscreen(el: HTMLElement) {
  const w = (el as HTMLElement & { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen;
  if (el.requestFullscreen) {
    return el.requestFullscreen();
  }
  if (typeof w === 'function') {
    w();
    return Promise.resolve();
  }
  return Promise.reject();
}

export function exitIfFullscreen() {
  if (document.fullscreenElement) {
    return document.exitFullscreen().catch(() => {});
  }
  return Promise.resolve();
}
