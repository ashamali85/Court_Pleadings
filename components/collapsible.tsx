'use client'

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'

type AccordionActions = {
  toggle: (id: string) => void
  openForError: (id: string) => void
}

type AccordionCtx = {
  openId: string | null
  /** kept in a ref so its identity never changes: a section's error effect must
   *  not re-run (and re-open itself) every time another section is toggled */
  actions: React.RefObject<AccordionActions>
}

const AccordionContext = createContext<AccordionCtx | null>(null)

/**
 * Groups SectionCards so only one is open at a time: opening another closes the
 * current one. Without this wrapper a SectionCard keeps its own open state.
 */
export function Accordion({
  children,
  initialOpenId = null,
}: {
  children: React.ReactNode
  initialOpenId?: string | null
}) {
  const [openId, setOpenId] = useState<string | null>(initialOpenId)
  // the first section reporting a validation error wins, so a later section
  // cannot pull the user away from the first problem on the page
  const errorOwner = useRef<string | null>(null)

  const actions = useRef<AccordionActions>({
    toggle: () => {},
    openForError: () => {},
  })

  actions.current = {
    toggle: (id) => {
      errorOwner.current = null
      setOpenId((current) => (current === id ? null : id))
    },
    openForError: (id) => {
      if (errorOwner.current && errorOwner.current !== id) return
      errorOwner.current = id
      setOpenId(id)
    },
  }

  const value = useMemo<AccordionCtx>(() => ({ openId, actions }), [openId])

  return <AccordionContext.Provider value={value}>{children}</AccordionContext.Provider>
}

/**
 * A card whose body collapses. Collapsed by default.
 *
 * The whole header strip is the button — its padding is the card's padding, so
 * clicking anywhere on the header row (not just the text) toggles the section.
 *
 * The body stays MOUNTED and is hidden with CSS; unmounting it would drop the
 * inputs out of the form and they would never reach the server action. A
 * section holding a validation error opens itself.
 */
export default function SectionCard({
  id,
  title,
  children,
  defaultOpen = false,
  hasError = false,
  errorLabel = 'يحتاج تصحيحاً',
  badge,
}: {
  id?: string
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  hasError?: boolean
  errorLabel?: string
  badge?: string
}) {
  const generatedId = useId()
  const sectionId = id ?? generatedId
  const bodyId = `${sectionId}-body`

  const accordion = useContext(AccordionContext)
  const [localOpen, setLocalOpen] = useState(defaultOpen)

  const open = accordion ? accordion.openId === sectionId : localOpen

  const actions = accordion?.actions
  useEffect(() => {
    if (!hasError) return
    if (actions) actions.current.openForError(sectionId)
    else setLocalOpen(true)
  }, [hasError, sectionId, actions])

  const toggle = () => {
    if (actions) actions.current.toggle(sectionId)
    else setLocalOpen((v) => !v)
  }

  return (
    <div className="card collapsible">
      <button
        type="button"
        className="section-head"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={toggle}
      >
        <span>
          {title}
          {hasError ? <span className="err-dot">{errorLabel}</span> : null}
          {!hasError && badge ? <span className="count-dot">{badge}</span> : null}
        </span>
        <span className="chev" aria-hidden="true">
          ▾
        </span>
      </button>

      <div className="section-body" id={bodyId} hidden={!open}>
        {children}
      </div>
    </div>
  )
}
