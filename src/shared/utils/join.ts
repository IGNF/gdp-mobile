export type JoinValue = string | false | null | undefined;

/**
 * Join non-empty string values using a separator.
 * Useful for conditional class names or label fragments.
 */
export function joinTruthy(
  values: JoinValue[],
  separator = ' '
): string {
  return values
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .join(separator);
}

export function joinCSSClassNames(...classNames: JoinValue[]): string {
  return joinTruthy(classNames, ' ');
}
