import { Capacitor } from '@capacitor/core';

/** Application servie dans un navigateur (hors shell Capacitor natif). */
export const IS_WEB_PLATFORM = !Capacitor.isNativePlatform();
