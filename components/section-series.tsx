'use client'

import { partyCountField, PARTY_SIDES, removePartyAt } from '@/lib/templates/party'
import { seriesCount, type RenderedSection } from '@/lib/templates/visibility'

/**
 * The + and حذف beside a repeatable section's title.
 *
 * Adding a party is one number going up: the section for it already exists in
 * the template, it was simply not being drawn. Removing one moves the parties
 * after it up, so the pleading never prints a gap where a party used to be.
 */
export default function SectionSeriesActions({
  section,
  values,
  setValues,
  addLabel,
  removeLabel,
}: {
  section: RenderedSection
  values: Record<string, unknown>
  setValues: (next: (prev: Record<string, unknown>) => Record<string, unknown>) => void
  addLabel?: string
  removeLabel?: string
}) {
  const repeat = section.repeat
  if (!repeat) return null

  const count = seriesCount(repeat.countField, values)
  const side = PARTY_SIDES.find((s) => partyCountField(s) === repeat.countField)

  return (
    <>
      {section.canRemove ? (
        <button
          type="button"
          className="section-remove"
          title={removeLabel ?? repeat.removeLabelAr}
          aria-label={removeLabel ?? repeat.removeLabelAr}
          onClick={() =>
            setValues((prev) =>
              side
                ? removePartyAt(prev, side, repeat.index, count)
                : { ...prev, [repeat.countField]: Math.max(1, count - 1) },
            )
          }
        >
          ×
        </button>
      ) : null}

      {section.canAdd ? (
        <button
          type="button"
          className="section-add"
          title={addLabel ?? repeat.addLabelAr}
          aria-label={addLabel ?? repeat.addLabelAr}
          onClick={() =>
            setValues((prev) => ({
              ...prev,
              [repeat.countField]: Math.min(repeat.max, count + 1),
            }))
          }
        >
          +
        </button>
      ) : null}
    </>
  )
}
