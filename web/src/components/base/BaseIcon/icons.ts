import upload from '@pictogrammers/memory-svg/svg/upload.svg?component';
import accountBox from '@pictogrammers/memory-svg/svg/account-box.svg?component';
import arrowLeftRight from '@pictogrammers/memory-svg/svg/arrow-left-right.svg?component';

export const icons = {
  upload,
  ['account-box']: accountBox,
  ['arrow-left-right']: arrowLeftRight,
};

export type IconName = keyof typeof icons;
