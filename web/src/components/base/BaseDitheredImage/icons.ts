import uploadSharp from '../../../assets/icons/account_circle_24dp_E3E3E3.svg';
import camera from 'pixelarticons/svg/camera.svg';
import arrowsHorizontal from 'pixelarticons/svg/reload.svg';
import aArrowUpSharp from 'pixelarticons/svg/a-arrow-up-sharp.svg';
import printer from 'pixelarticons/svg/printer.svg';
import warningDiamond from 'pixelarticons/svg/warning-diamond.svg';
import check from 'pixelarticons/svg/check.svg';
import grid2x22Sharp from 'pixelarticons/svg/grid-2x2-2-sharp.svg';
import receiptSharp from 'pixelarticons/svg/receipt-sharp.svg';

/**
 * @see https://pixelarticons.com/
 */

export const icons = {
  ['a-arrow-up-sharp']: aArrowUpSharp,
  ['upload-sharp']: uploadSharp,
  camera,
  ['reload']: arrowsHorizontal,
  printer,
  ['warning-diamond']: warningDiamond,
  ['check']: check,
  ['grid-2x2-2-sharp']: grid2x22Sharp,
  ['receipt-sharp']: receiptSharp,
};

export type IconName = keyof typeof icons;
