/**
 * Which fields a set of values actually puts on the screen.
 *
 * This lives apart from the form component because it decides more than
 * layout: a field that is not rendered has no input, so it posts nothing and
 * its stored value is lost on the next submit. That makes it worth testing
 * without a browser, which a 'use client' module cannot be.
 */
import type { FieldDef } from '@/lib/templates/types'

/** The string a control would hold for this value — the form's own view of it. */
export function fieldString(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return value ? 'true' : ''
  return String(value)
}

/**
 * A field with `showWhen` exists only while another field holds one of the
 * listed values. Hidden means unmounted, so it submits nothing at all and the
 * schema decides what an absent value means.
 */
export function isFieldVisible(
  field: FieldDef,
  values: Record<string, unknown>,
): boolean {
  if (!field.showWhen) return true
  return field.showWhen.equals.includes(fieldString(values[field.showWhen.field]))
}
