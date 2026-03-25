import uploadSharp from 'pixelarticons/svg/upload-sharp.svg';
import camera from 'pixelarticons/svg/camera.svg';
import arrowsHorizontal from 'pixelarticons/svg/arrows-horizontal.svg';
import aArrowUpSharp from 'pixelarticons/svg/a-arrow-up-sharp.svg';
import printer from 'pixelarticons/svg/printer.svg';
import warningDiamond from 'pixelarticons/svg/warning-diamond.svg';
import check from 'pixelarticons/svg/check.svg';

/**
 * @see https://pixelarticons.com/
 */

export const icons = {
  ['a-arrow-up-sharp']: aArrowUpSharp,
  ['upload-sharp']: uploadSharp,
  camera,
  ['arrows-horizontal']: arrowsHorizontal,
  printer,
  ['warning-diamond']: warningDiamond,
  ['check']: check,
};

export type IconName = keyof typeof icons;
