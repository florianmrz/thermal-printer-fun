import type { InjectionKey, Ref } from 'vue';
import type { PrinterStatus } from '../../../shared/const';

export const printerStatusInjectionKey = Symbol('printerStatus') as InjectionKey<Readonly<Ref<PrinterStatus, PrinterStatus>>>;
