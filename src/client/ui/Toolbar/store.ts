import { type Writable, writable } from 'svelte/store';
import { Tools, type ShapeType, type Tool } from 'client/interfaces';

class ToolbarStore {
  tool: Writable<Tool | null> = writable(Tools.NOTE);
  shapeType: Writable<ShapeType | null> = writable(Tools.NOTE);

  changeTool(tool: Tool): void {
    this.tool.set(tool);
    this.setShapeType(tool);
  }

  setShapeType(tool: Tool): void {
    if (this.isShapeToolSelected(tool)) {
      this.shapeType.set(<ShapeType>tool);
    } else {
      this.shapeType.set(null);
    }
  }

  isShapeToolSelected(tool: Tool): boolean {
    return ['NOTE', 'TEXT'].includes(tool);
  }

  isServiceToolSelected(tool: Tool): boolean {
    return ['PAN', 'SELECT', 'DELETE'].includes(tool);
  }
}

export const toolbarStore = new ToolbarStore();