import arrowsHorizontal from 'pixelarticons/svg/arrows-horizontal.svg';
import warningDiamond from 'pixelarticons/svg/warning-diamond.svg';
import check from 'pixelarticons/svg/check.svg';
import listBox from 'pixelarticons/svg/list-box.svg';
import priner from 'pixelarticons/svg/printer.svg';
import loader from 'pixelarticons/svg/loader.svg';

/**
 * @see https://pixelarticons.com/
 */

export const icons = {
  ['arrows-horizontal']: arrowsHorizontal,
  ['warning-diamond']: warningDiamond,
  ['check']: check,
  ['list-box']: listBox,
  ['printer']: priner,
  ['loader']: loader,
};

export type IconName = keyof typeof icons;
