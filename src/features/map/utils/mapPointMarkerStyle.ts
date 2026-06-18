import { Icon, Style } from 'ol/style';

function encodeMarkerSvg(svg: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createFilledMapMarkerIconSrc(color: string): string {
  const markerSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="14" fill="${color}" stroke="#ffffff" stroke-width="3"/>
      <circle cx="18" cy="18" r="5" fill="#ffffff"/>
    </svg>
  `;

  return encodeMarkerSvg(markerSvg);
}

function createRingMapMarkerIconSrc(color: string): string {
  const markerSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="20" fill="${color}" fill-opacity="0.22"/>
      <circle cx="24" cy="24" r="14" fill="none" stroke="${color}" stroke-width="4"/>
      <circle cx="24" cy="24" r="5" fill="${color}" stroke="#ffffff" stroke-width="2"/>
    </svg>
  `;

  return encodeMarkerSvg(markerSvg);
}

export type MapPointMarkerVariant = 'filled' | 'ring';

export function createMapPointMarkerStyle(
  color: string,
  variant: MapPointMarkerVariant = 'filled',
): Style {
  return new Style({
    image: new Icon({
      src:
        variant === 'ring'
          ? createRingMapMarkerIconSrc(color)
          : createFilledMapMarkerIconSrc(color),
      anchor: [0.5, 0.5],
      rotateWithView: false,
    }),
  });
}
