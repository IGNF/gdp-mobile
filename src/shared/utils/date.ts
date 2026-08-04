const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const TIME_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(date: Date): string {
  return DATE_FORMATTER.format(date);
}

export function formatTime(date: Date): string {
  return TIME_FORMATTER.format(date);
}

export function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function formatRelativeDayLabel(date: Date, now: Date = new Date()): string {
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);

  if (diffDays === 0) {
    return "Aujourd'hui";
  }
  if (diffDays === 1) {
    return 'Hier';
  }

  return formatDate(date);
}
