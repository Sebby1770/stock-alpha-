const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const parseDateOnly = (value) => {
  if (typeof value !== 'string' || !DATE_ONLY_PATTERN.test(value)) {
    throw new TypeError('Expected a date in YYYY-MM-DD format.');
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new RangeError(`Invalid calendar date: ${value}`);
  }
  return date;
};

export const formatDateOnly = (value, options = {}) => parseDateOnly(value).toLocaleDateString(
  'en-US',
  { ...options, timeZone: 'UTC' },
);
