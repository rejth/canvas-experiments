import {
  DEFAULT_CANVAS_SCALE,
  DEFAULT_SCALE,
  type TextAlign,
  type TextDecoration,
} from 'client/shared/constants';
import type { BaseCanvasEntityDrawOptions } from 'client/ui/Canvas/BaseCanvasEntity';
import { BaseCanvasEntity, CanvasEntityType } from 'client/ui/Canvas/BaseCanvasEntity';

export interface TextDrawOptions extends BaseCanvasEntityDrawOptions {
  text: string;
  font: string;
  fontSize: number;
  fontStyle: string;
  textAlign: TextAlign;
  textDecoration: TextDecoration;
}

export class CanvasText extends BaseCanvasEntity<TextDrawOptions> {
  #snapshot: CanvasImageSource | null = null;
  #preparedText: string[] = [];

  constructor(options: TextDrawOptions) {
    super(options);
    this.setType(CanvasEntityType.TEXT);
    this.prepareText(options.text, options.font, options.fontSize, options.fontStyle);
  }

  setText(
    text: string,
    font: string,
    fontSize: number,
    fontStyle: string,
    textAlign: TextAlign,
    textDecoration: TextDecoration,
  ) {
    const options = this.getOptions();
    this.prepareText(text, font, fontSize, fontStyle);

    if (
      text !== options.text ||
      font !== options.font ||
      fontSize !== options.fontSize ||
      fontStyle !== options.fontStyle ||
      textAlign !== options.textAlign ||
      textDecoration !== options.textDecoration
    ) {
      this.setSnapshot(null);
    }

    this.setOptions({ text, font, fontSize, fontStyle, textAlign, textDecoration });
  }

  prepareText(text: string, font: string, fontSize: number, fontStyle = '') {
    const {
      width,
      height,
      scale = DEFAULT_SCALE,
      canvasScale = DEFAULT_CANVAS_SCALE,
    } = this.getOptions();

    const offscreenCanvas = new OffscreenCanvas(width, height);
    offscreenCanvas.width = Math.floor(width * canvasScale);
    offscreenCanvas.height = Math.floor(height * canvasScale);

    const ctx = offscreenCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
    ctx.scale(canvasScale, canvasScale);
    ctx.font = `${fontStyle ? fontStyle : 400} ${fontSize}px monospace`;

    const fragments = text.split(/[\r\n]/);
    const preparedText: string[] = [];
    let textToRender = '';

    for (const fragment of fragments) {
      if (fragment === '') {
        preparedText.push('');
      } else {
        for (const substring of fragment) {
          const textMetrics = ctx.measureText(textToRender + substring);
          const rectWidth = width - 10 * scale;

          if (textMetrics.width * scale >= rectWidth) {
            preparedText.push(textToRender);
            textToRender = '';
          }

          textToRender += substring;
        }

        if (textToRender !== '') {
          preparedText.push(textToRender);
          textToRender = '';
        }
      }
    }

    this.#preparedText = preparedText;
  }

  getPreparedText(): string[] {
    return this.#preparedText;
  }

  setSnapshot(snapshot: CanvasImageSource | null) {
    this.#snapshot = snapshot;
  }

  getSnapshot(): CanvasImageSource | null {
    return this.#snapshot;
  }
}
