import type { CanvasContextType, PixelRatio } from './types';

interface TransformationMatrix {
  translationX: number;
  translationY: number;
  scaleX: number;
  scaleY: number;
  skewY: number;
  skewX: number;
  initialScale: number;
}

interface ClearRectOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Renderer {
  context: CanvasContextType | null;

  width?: number;
  height?: number;
  initialPixelRatio?: PixelRatio;
  pixelRatio?: PixelRatio;
  useLayerEvents?: boolean;

  constructor() {
    this.context = null;
  }

  init(context: CanvasContextType, useLayerEvents: boolean, pixelRatio: PixelRatio) {
    this.context = context;
    this.useLayerEvents = useLayerEvents;
    this.initialPixelRatio = pixelRatio;
  }

  getContext() {
    return this.context;
  }

  getTransform(): TransformationMatrix {
    const transform = this.context!.getTransform();
    return {
      scaleX: transform.a,
      skewY: transform.b,
      skewX: transform.c,
      scaleY: transform.d,
      translationX: transform.e,
      translationY: transform.f,
      initialScale: this.initialPixelRatio!,
    };
  }

  /*
   * https://roblouie.com/article/617/transforming-mouse-coordinates-to-canvas-coordinates/
   * This method has been modified. The original method doesn't take in account current scale.
   * https://math.hws.edu/graphicsbook/c6/s5.html#webgl.5.1
   * */
  getTransformedPoint(x: number, y: number) {
    const transform = this.getTransform();
    const inverseZoom = 1 / (transform.scaleX / transform.initialScale);
    const transformedX = inverseZoom * x - inverseZoom * (transform.translationX / transform.initialScale);
    const transformedY = inverseZoom * y - inverseZoom * (transform.translationY / transform.initialScale);

    return { x: transformedX, y: transformedY };
  }

  getScaledArea() {
    const transform = this.getTransform();
    const inverseScale = 2 / transform.scaleX < 2 ? 2 : 2 / transform.scaleX;

    return {
      x: transform.translationX > 0 ? -transform.translationX * inverseScale : 0,
      y: transform.translationY > 0 ? -transform.translationY * inverseScale : 0,
      width: window.innerWidth * inverseScale + Math.abs(transform.translationX) * inverseScale,
      height: window.innerHeight * inverseScale + Math.abs(transform.translationY) * inverseScale,
    };
  }

  scale(scaleX: number, scaleY: number) {
    this.context!.scale(scaleX, scaleY);
    this.pixelRatio = this.getTransform().scaleX;
  }

  clearRect({ x, y, width, height }: ClearRectOptions, callBack: () => void) {
    requestAnimationFrame(() => {
      this.context!.clearRect(x, y, width, height);
      callBack();
    });
  }

  clearRectSync({ x, y, width, height }: ClearRectOptions) {
    this.context!.clearRect(x, y, width, height);
  }

  canvasScaleToPercentage(scale: number): number {
    return Math.max(10, Math.min(Math.ceil((scale * 200) / 10), 200));
  }

  zoomPercentageToScale(percentage: number): number {
    return (percentage * 10) / 200;
  }
}
