import { COLORS, createHitCanvas, GeometryManager } from './index';
import {
  type HitCanvasRenderingContext2D,
  type OriginalEvent,
  type Render,
  type LayerId,
  type LayerEventDetails,
  type CanvasEvents,
  type LayerEventDispatcher,
} from './types';

export class RenderManager {
  canvas: HTMLCanvasElement | null;
  context: HitCanvasRenderingContext2D | null;
  geometryManager: GeometryManager;

  currentLayerId: LayerId;
  activeLayerId: LayerId;
  layerSequence: LayerId[];
  layer: HTMLDivElement | null;
  layerObserver: MutationObserver | null;

  drawers: Map<LayerId, Render>;
  dispatchers: Map<LayerId, LayerEventDispatcher>;
  needsRedraw: boolean;

  width?: number;
  height?: number;
  pixelRatio?: number;
  frame?: number;

  constructor() {
    this.canvas = null;
    this.context = null;
    this.geometryManager = new GeometryManager();

    this.currentLayerId = 1;
    this.activeLayerId = 0;
    this.layerSequence = [];
    this.layer = null;
    this.layerObserver = null;

    this.drawers = new Map();
    this.dispatchers = new Map();
    this.needsRedraw = true;

    this.render = this.render.bind(this);
    this.redraw = this.redraw.bind(this);
  }

  init(
    canvas: HTMLCanvasElement,
    layer: HTMLDivElement,
    settings?: CanvasRenderingContext2DSettings,
  ) {
    this.canvas = canvas;
    this.layer = layer;
    this.context = createHitCanvas(canvas, settings);
    this.observeLayerSequence();
    this.startRenderLoop();
  }

  startRenderLoop() {
    this.render();
    this.frame = requestAnimationFrame(() => this.startRenderLoop());
  }

  observeLayerSequence() {
    this.layerObserver = new MutationObserver(() => this.getLayerSequence());
    this.layerObserver.observe(this.layer!, { childList: true });
    this.getLayerSequence();
  }

  getLayerSequence() {
    const layers = <HTMLElement[]>[...this.layer!.children];
    this.layerSequence = layers.map((layer) => +layer.dataset.layerId!);
    this.redraw();
  }

  register({ render, dispatcher }: { render: Render; dispatcher: LayerEventDispatcher }) {
    this.addDrawer(this.currentLayerId, render);
    this.addDispatcher(this.currentLayerId, dispatcher);
    this.redraw();

    return {
      unregister: () => this.unregister(this.currentLayerId),
      layerId: this.currentLayerId++,
    };
  }

  unregister(layerId: LayerId) {
    this.removeDrawer(layerId);
    this.removeDispatcher(layerId);
    this.redraw();
  }

  addDrawer(layerId: LayerId, render: Render) {
    this.drawers.set(layerId, render);
  }

  addDispatcher(layerId: LayerId, dispatcher: LayerEventDispatcher) {
    this.dispatchers.set(layerId, dispatcher);
  }

  removeDrawer(layerId: LayerId) {
    this.drawers.delete(layerId);
  }

  removeDispatcher(layerId: LayerId) {
    this.dispatchers.delete(layerId);
  }

  /**
   * The main render function which is responsible for drawing, clearing and canvas's transformation matrix adjustment.
   * Renders the canvas only when width, height or pixelRatio change.
   * */
  render() {
    if (!this.needsRedraw) return;

    const context = this.context!;
    const width = this.width!;
    const height = this.height!;

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, width, height);

    for (const layerId of this.layerSequence) {
      context.setActiveLayerId(layerId);
      this.drawers.get(layerId)?.({ ctx: context, geometry: this.geometryManager });
    }

    this.needsRedraw = false;
  }

  /**
   * Forces canvas's transformation matrix adjustment to scale drawings according to the new width, height or device's pixel ratio.
   */
  redraw() {
    this.needsRedraw = true;
  }

  /**
   * Handles "mousemove", "pointermove" and "touchstart" events on the canvas to identify the layer.
   * Then re-dispatch the events to the Layer component and sets the active layer.
   */

  findActiveLayer(e: OriginalEvent) {
    const point = this.geometryManager.calculatePosition(e);
    const layerId = this.context!.getLayerIdAt(point.x, point.y);

    if (this.activeLayerId === layerId) return;

    if (e instanceof MouseEvent) {
      this.dispatchLayerEvent(this.activeLayerId, {
        originalEvent: new PointerEvent('pointerleave', e),
        ...point,
      });
      this.dispatchLayerEvent(this.activeLayerId, {
        originalEvent: new MouseEvent('mouseleave', e),
        ...point,
      });
    }

    this.activeLayerId = layerId;

    if (e instanceof MouseEvent) {
      this.dispatchLayerEvent(this.activeLayerId, {
        originalEvent: new PointerEvent('pointerenter', e),
        ...point,
      });
      this.dispatchLayerEvent(this.activeLayerId, {
        originalEvent: new MouseEvent('mouseenter', e),
        ...point,
      });
    }
  }

  /**
   * Handles events on the canvas and then re-dispatch the events to the corresponding layer
   */
  dispatchEvent(e: OriginalEvent) {
    if (!this.activeLayerId) return;
    const point = this.geometryManager.calculatePosition(e);
    this.dispatchLayerEvent(this.activeLayerId, { originalEvent: e, ...point });
  }

  /**
   * Dispatches events to the Layer component.
   */
  dispatchLayerEvent(layerId: LayerId, details: LayerEventDetails) {
    const dispatch = this.dispatchers.get(layerId);
    dispatch?.(<CanvasEvents>details.originalEvent.type, details);
  }

  drawBackgroundGrid(backgroundCanvas: HTMLCanvasElement) {
    const width = 10;
    const height = 10;
    const radius = 1;
    const scale = this.pixelRatio!;

    const context = backgroundCanvas.getContext('2d')!;
    const transform = context.getTransform();

    const canvas = new OffscreenCanvas(width, height);
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);

    const offscreenContext = canvas.getContext('2d')!;
    offscreenContext.beginPath();
    offscreenContext.fillStyle = COLORS.GRID;
    offscreenContext.arc(1, 1, radius, 0, 2 * Math.PI);
    offscreenContext.fill();

    const pattern = context.createPattern(canvas, 'repeat');
    if (!pattern) return;

    context.save();

    context.setTransform(1, transform.b, transform.c, 1, transform.e, transform.f);
    context.fillStyle = pattern;
    context.fillRect(-transform.e / scale, -transform.f / scale, this.width!, this.height!);

    context.restore();
  }

  destroy() {
    if (typeof window === 'undefined') return;

    this.layerObserver?.disconnect();
    cancelAnimationFrame(this.frame!);
  }
}
