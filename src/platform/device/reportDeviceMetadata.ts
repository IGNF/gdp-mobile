import { App } from '@capacitor/app';
import { Device } from '@capacitor/device';

export interface ReportSubmissionDeviceInfo {
  appVersion: string;
  platformLabel: string;
}

function resolveAppVersion(fallbackVersion: string): string {
  if (typeof __APP_VERSION__ === 'string' && __APP_VERSION__.trim()) {
    return __APP_VERSION__.trim();
  }

  return fallbackVersion.trim() || '0.0.0';
}

function getWebBrowserLabel(): string {
  const userAgent = navigator.userAgent;

  const edgeMatch = userAgent.match(/Edg\/([\d.]+)/);
  if (edgeMatch) {
    return `Edge ${edgeMatch[1]}`;
  }

  const firefoxMatch = userAgent.match(/Firefox\/([\d.]+)/);
  if (firefoxMatch) {
    return `Firefox ${firefoxMatch[1]}`;
  }

  const chromeMatch = userAgent.match(/Chrome\/([\d.]+)/);
  if (chromeMatch && !userAgent.includes('Edg/')) {
    return `Chrome ${chromeMatch[1]}`;
  }

  const safariMatch = userAgent.match(/Version\/([\d.]+).*Safari/);
  if (safariMatch && !userAgent.includes('Chrome/')) {
    return `Safari ${safariMatch[1]}`;
  }

  return 'Navigateur web';
}

function buildPlatformLabel(platform: string, osVersion: string): string {
  switch (platform) {
    case 'android':
      return osVersion ? `Android ${osVersion}` : 'Android';
    case 'ios':
      return osVersion ? `iOS ${osVersion}` : 'iOS';
    case 'web':
      return `Web (${getWebBrowserLabel()})`;
    default:
      return platform || 'Inconnu';
  }
}

/**
 * Métadonnées techniques ajoutées au commentaire API à l’envoi (invisibles dans le formulaire).
 */
export async function getReportSubmissionDeviceInfo(): Promise<ReportSubmissionDeviceInfo> {
  const [appInfo, deviceInfo] = await Promise.all([
    App.getInfo().catch(() => null),
    Device.getInfo(),
  ]);

  return {
    appVersion: resolveAppVersion(appInfo?.version ?? ''),
    platformLabel: buildPlatformLabel(deviceInfo.platform, deviceInfo.osVersion),
  };
}

export function appendDeviceInfoToReportComment(
  userComment: string,
  deviceInfo: ReportSubmissionDeviceInfo,
): string {
  const footer = `GDP Mobile ${deviceInfo.appVersion} | ${deviceInfo.platformLabel}`;
  const trimmedComment = userComment.trim();

  if (!trimmedComment) {
    return footer;
  }

  return `${trimmedComment}\n\n${footer}`;
}
