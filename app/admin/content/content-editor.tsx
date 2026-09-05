'use client'

import { useActionState, useMemo, useState } from 'react'
import { saveContent, type ContentState } from '@/app/admin/content/actions'
import SectionCard from '@/components/collapsible'
import SubmitButton from '@/components/submit-button'

type Entry = {
  key: string
  group: string
  value: string
  defaultValue: string
}

export default function ContentEditor({
  entries,
  groups,
  labels,
}: {
  entries: Entry[]
  groups: { key: string; titleAr: string }[]
  labels: {
    search: string
    save: string
    loading: string
    defaultLabel: string
    modified: string
  }
}) {
  const [state, action] = useActionState<ContentState, FormData>(saveContent, {})
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries
    return entries.filter(
      (e) =>
        e.key.toLowerCase().includes(q) ||
        e.value.toLowerCase().includes(q) ||
        e.defaultValue.toLowerCase().includes(q),
    )
  }, [entries, query])

  const byGroup = useMemo(() => {
    const map = new Map<string, Entry[]>()
    for (const entry of filtered) {
      const list = map.get(entry.group) ?? []
      list.push(entry)
      map.set(entry.group, list)
    }
    return map
  }, [filtered])

  const knownGroups = groups.filter((g) => byGroup.has(g.key))
  const otherGroups = [...byGroup.keys()].filter(
    (key) => !groups.some((g) => g.key === key),
  )

  return (
    <form action={action}>
      {state.error ? <div className="alert error">{state.error}</div> : null}
      {state.ok ? <div className="alert ok">{state.ok}</div> : null}

      <div className="card">
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="content-search">{labels.search}</label>
          <input
            id="content-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="…"
          />
        </div>
      </div>

      {[
        ...knownGroups.map((g) => [g.key, g.titleAr] as const),
        ...otherGroups.map((k) => [k, k] as const),
      ].map(([groupKey, title]) => {
        const items = byGroup.get(groupKey) ?? []
        const changed = items.filter((e) => e.value !== e.defaultValue).length
        return (
          <SectionCard
            key={groupKey}
            title={title}
            defaultOpen={Boolean(query)}
            badge={changed > 0 ? `${changed} ${labels.modified}` : `${items.length}`}
          >
            {items.map((entry) => {
              const long = entry.defaultValue.length > 60
              return (
                <div className="field" key={entry.key}>
                  <label htmlFor={`text__${entry.key}`}>
                    <span className="content-key" dir="ltr">
                      {entry.key}
                    </span>
                  </label>
                  {long ? (
                    <textarea
                      id={`text__${entry.key}`}
                      name={`text__${entry.key}`}
                      rows={3}
                      defaultValue={entry.value}
                    />
                  ) : (
                    <input
                      id={`text__${entry.key}`}
                      name={`text__${entry.key}`}
                      type="text"
                      defaultValue={entry.value}
                    />
                  )}
                  {entry.value !== entry.defaultValue ? (
                    <div className="hint">
                      {labels.defaultLabel} {entry.defaultValue}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </SectionCard>
        )
      })}

      <div className="card">
        <div className="actions">
          <SubmitButton loadingLabel={labels.loading}>{labels.save}</SubmitButton>
        </div>
      </div>
    </form>
  )
}
