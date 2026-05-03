import arrowsHorizontal from 'pixelarticons/svg/arrows-horizontal.svg';
import warningDiamond from 'pixelarticons/svg/warning-diamond.svg';
import check from 'pixelarticons/svg/check.svg';

/**
 * @see https://pixelarticons.com/
 */

export const icons = {
  ['arrows-horizontal']: arrowsHorizontal,
  ['warning-diamond']: warningDiamond,
  ['check']: check,
};

export type IconName = keyof typeof icons;
