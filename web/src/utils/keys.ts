import type { InjectionKey, Ref } from 'vue';
import type { PrinterStatus } from '@thermal-printer-fun/shared';

export const printerStatusInjectionKey = Symbol('printerStatus') as InjectionKey<Readonly<Ref<PrinterStatus, PrinterStatus>>>;
