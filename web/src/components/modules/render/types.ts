import type { RenderData } from "@thermal-printer-fun/shared";

export interface RenderModuleProps<T extends RenderData> {
  data: T;
  onReady: () => void;
}
