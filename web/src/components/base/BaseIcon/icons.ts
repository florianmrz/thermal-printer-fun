import upload from '@pictogrammers/memory-svg/svg/upload.svg?component';
import accountBox from '@pictogrammers/memory-svg/svg/account-box.svg?component';

export const icons = {
  upload,
  ['account-box']: accountBox
};

export type IconName = keyof typeof icons;
