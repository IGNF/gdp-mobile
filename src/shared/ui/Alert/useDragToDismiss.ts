import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

const DISMISS_DRAG_THRESHOLD_PX = 64;

/** Glisser vers le bas au-delà du seuil ferme la carte ; vers le haut, elle reste en place. */
export function useDragToDismiss(onDismiss: () => void, enabled = true) {
	const [offset, setOffset] = useState(0);
	const [isDragging, setIsDragging] = useState(false);
	const startYRef = useRef(0);

	const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
		if (!enabled) {
			return;
		}
		event.currentTarget.setPointerCapture(event.pointerId);
		startYRef.current = event.clientY;
		setIsDragging(true);
	};

	const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
		if (!isDragging) {
			return;
		}
		setOffset(Math.max(0, event.clientY - startYRef.current));
	};

	const endDrag = () => {
		if (!isDragging) {
			return;
		}
		setIsDragging(false);
		if (offset > DISMISS_DRAG_THRESHOLD_PX) {
			onDismiss();
		}
		setOffset(0);
	};

	return {
		offset,
		isDragging,
		dragHandleProps: enabled
			? {
					onPointerDown,
					onPointerMove,
					onPointerUp: endDrag,
					onPointerCancel: endDrag,
				}
			: {},
	};
}
