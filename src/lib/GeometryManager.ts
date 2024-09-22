import type { OriginalEvent, Bounds, Point, RectDimension, PixelRatio } from './types';

export class GeometryManager {
  defaultPoint: Point;

  constructor() {
    this.defaultPoint = { x: 0, y: 0 };
  }

  getMousePosition(e: MouseEvent, pixelRatio: PixelRatio = 1): Point {
    return {
      x: e.offsetX * pixelRatio,
      y: e.offsetY * pixelRatio,
    };
  }

  getTouchPosition(e: TouchEvent, pixelRatio: PixelRatio = 1): Point {
    const { left, top } = (<Element>e.target).getBoundingClientRect();
    const { clientX, clientY } = e.changedTouches[0];
    return {
      x: (clientX - left) * pixelRatio,
      y: (clientY - top) * pixelRatio,
    };
  }

  calculatePosition(e: OriginalEvent, pixelRatio: PixelRatio = 1): Point {
    if (window.TouchEvent && e instanceof TouchEvent) {
      return this.getTouchPosition(e, pixelRatio);
    } else if (e instanceof MouseEvent) {
      return this.getMousePosition(e, pixelRatio);
    }

    return this.defaultPoint;
  }

  getRectDimension(bounds: Bounds): RectDimension {
    const { x0, y0, x1, y1 } = bounds;
    return {
      x: Math.min(x0, x1),
      y: Math.min(y0, y1),
      width: Math.abs(x0 - x1),
      height: Math.abs(y0 - y1),
    };
  }

  getPathBounds(path: Point[]): Bounds {
    const from = path[0] || this.defaultPoint;
    const to = path[path.length - 1] || this.defaultPoint;
    return {
      x0: from.x,
      y0: from.y,
      x1: to.x,
      y1: to.y,
    };
  }

  getMiddlePoint(from: number, to: number): number {
    return (from + to) / 2;
  }
}
