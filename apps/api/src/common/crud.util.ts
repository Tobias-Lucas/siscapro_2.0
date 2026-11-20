export function clean<T extends Record<string, any>>(input: T): T {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined && value !== '')) as T;
}
import { BadRequestException } from '@nestjs/common';

export function toDate(value?: string | Date | null) {
  if (value === null) return null;
  if (value === undefined || value === '') return undefined;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new BadRequestException('Data invalida');
  return date;
}
