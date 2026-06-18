export type RawObject = Record<string, unknown>;
export type FormFieldValue<TExtra = never> = string | string[] | TExtra;

export function toRawObject(value: unknown): RawObject | null {
	if (value && typeof value === 'object') {
		return value as RawObject;
	}
	return null;
}

export function toNumber(value: unknown): number | undefined {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value;
	}

	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number(value);
		if (Number.isFinite(parsed)) {
			return parsed;
		}
	}

	return undefined;
}

export function toBoolean(value: unknown): boolean | undefined {
	if (typeof value === 'boolean') {
		return value;
	}

	if (value === 1 || value === '1' || value === 'true') {
		return true;
	}

	if (value === 0 || value === '0' || value === 'false') {
		return false;
	}

	return undefined;
}

export function toStringValue(value: unknown): string | undefined {
	return typeof value === 'string' ? value : undefined;
}

export function toStringFieldValue(value: unknown): string {
	if (typeof value === 'string') {
		return value;
	}

	if (typeof value === 'number' || typeof value === 'boolean') {
		return String(value);
	}

	return '';
}

export function toStringArrayFieldValue(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.map((item) => String(item));
	}

	if (
		typeof value === 'string' ||
		typeof value === 'number' ||
		typeof value === 'boolean'
	) {
		return [String(value)];
	}

	return [];
}
