import { on, once } from './listeners';
import { filter, any, every, sequence, watch, onlyEvent } from './async-generators';

type Target = (Window & typeof globalThis) | Document | HTMLElement;

export function dndWatcher<T>(target: HTMLElement): AsyncGenerator<T> {
  return watch(() =>
    filter(
      sequence(
        once(target, 'mousedown'),
        every(any(on(window, 'mousemove'), on(window, 'mouseup')), onlyEvent('mousemove')),
      ),
      onlyEvent('mousemove'),
    ),
  );
}

export function targetEventWatcher<T, E extends keyof HTMLElementEventMap>(
  target: Target,
  event: E,
): AsyncGenerator<T> {
  const allEvents = () => true;

  return watch(() =>
    filter(
      sequence(
        once(target, 'mousedown'),
        every(any(on(document, 'mousemove'), on(target, 'mouseup')), allEvents),
      ),
      onlyEvent(event),
    ),
  );
}
