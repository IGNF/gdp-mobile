import {
  Geolocation,
  type CallbackID,
  type PermissionStatus,
  type Position,
  type PositionOptions,
  type WatchPositionCallback,
} from '@capacitor/geolocation';

export type {
  CallbackID,
  PermissionStatus,
  Position,
  PositionOptions,
  WatchPositionCallback,
};

const NAVIGATOR_WATCH_PREFIX = 'navigator:';
const CAPACITOR_WATCH_PREFIX = 'capacitor:';

const navigatorWatchMap = new Map<CallbackID, number>();

function toCallbackId(value: string): CallbackID {
  return value as CallbackID;
}

function hasNavigatorGeolocation(): boolean {
  return typeof navigator !== 'undefined' && Boolean(navigator.geolocation);
}

function watchUsersLocationWithNavigator(
  callback: WatchPositionCallback,
  options?: PositionOptions,
): CallbackID {
  const watchId = navigator.geolocation.watchPosition(
    (position) => callback(toPosition(position)),
    (error) => callback(null, error),
    options,
  );

  const callbackId = toCallbackId(`${NAVIGATOR_WATCH_PREFIX}${watchId}`);
  navigatorWatchMap.set(callbackId, watchId);
  return callbackId;
}

async function getUsersLocationWithNavigator(options?: PositionOptions): Promise<Position> {
  return await new Promise<Position>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(toPosition(position)),
      (error) => reject(error),
      options,
    );
  });
}

async function getUsersLocationWithCapacitorFallback(
  options?: PositionOptions,
): Promise<Position> {
  try {
    return await Geolocation.getCurrentPosition(options);
  } catch (capacitorError) {
    if (hasNavigatorGeolocation()) {
      return await getUsersLocationWithNavigator(options);
    }
    throw capacitorError;
  }
}

async function watchUsersLocationWithCapacitorFallback(
  callback: WatchPositionCallback,
  options?: PositionOptions,
): Promise<CallbackID> {
  try {
    const capacitorWatchId = await Geolocation.watchPosition(options ?? {}, callback);
    return toCallbackId(`${CAPACITOR_WATCH_PREFIX}${capacitorWatchId}`);
  } catch (capacitorError) {
    if (hasNavigatorGeolocation()) {
      return watchUsersLocationWithNavigator(callback, options);
    }
    throw capacitorError;
  }
}

function toPosition(value: GeolocationPosition): Position {
  return value as unknown as Position;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error ?? 'Unknown geolocation error');
}

export class Gdp_Geolocation {
  static async ensurePermissions(): Promise<boolean> {
    try {
      const permissions = await this.checkPermissions();
      if (permissions.location !== 'granted') {
        const newPermissions = await this.requestPermissions();
        return newPermissions.location === 'granted';
      }
      return true;
    } catch {
      return true;
    }
  }

  static async checkPermissions(): Promise<PermissionStatus> {
    return await Geolocation.checkPermissions();
  }

  static async requestPermissions(): Promise<PermissionStatus> {
    return await Geolocation.requestPermissions();
  }

  static async getUsersLocation(options?: PositionOptions): Promise<Position | null> {
    try {
      const hasPermission = await this.ensurePermissions();
      if (!hasPermission) {
        return null;
      }

      return await getUsersLocationWithCapacitorFallback(options);
    } catch (error) {
      console.error('Error getting users location:', toErrorMessage(error));
      return null;
    }
  }

  static async watchUsersLocation(
    callback: WatchPositionCallback,
    options?: PositionOptions,
  ): Promise<CallbackID | null> {
    try {
      const hasPermission = await this.ensurePermissions();
      if (!hasPermission) {
        return null;
      }

      return await watchUsersLocationWithCapacitorFallback(callback, options);
    } catch (error) {
      console.error('Error watching users location:', toErrorMessage(error));
      return null;
    }
  }

  static async clearWatch(watchId: CallbackID): Promise<void> {
    if (!watchId) {
      return;
    }

    const nativeWatchId = navigatorWatchMap.get(watchId);
    if (nativeWatchId !== undefined) {
      navigatorWatchMap.delete(watchId);
      navigator.geolocation?.clearWatch(nativeWatchId);
      return;
    }

    const watchIdValue = String(watchId);
    if (watchIdValue.startsWith(CAPACITOR_WATCH_PREFIX)) {
      const capacitorId = watchIdValue.slice(CAPACITOR_WATCH_PREFIX.length);
      return await Geolocation.clearWatch({ id: capacitorId });
    }

    if (/^\d+$/.test(watchIdValue)) {
      navigator.geolocation?.clearWatch(Number(watchIdValue));
      return;
    }

    return await Geolocation.clearWatch({ id: watchIdValue });
  }
}
