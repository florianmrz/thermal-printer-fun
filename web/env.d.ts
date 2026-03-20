/// <reference types="vite/client" />
/// <reference types="vite-svg-loader" />

import type { RenderData } from '@thermal-printer-fun/shared';

declare global {
	interface Window {
		__RENDER_DATA__?: RenderData;
		__RENDER_READY__?: boolean;
	}
}
