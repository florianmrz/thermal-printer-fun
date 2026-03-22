import upload from 'pixelarticons/svg/upload.svg';
import camera from 'pixelarticons/svg/camera.svg';
import arrowsHorizontal from 'pixelarticons/svg/arrows-horizontal.svg';

/**
 * @see https://pixelarticons.com/
 */

export const icons = {
  upload,
  camera,
  ['arrows-horizontal']: arrowsHorizontal,
};

export type IconName = keyof typeof icons;
