'use client'

import { useActionState, useState } from 'react'
import {
  createJob,
  deleteJob,
  moveJob,
  updateJob,
  type JobsState,
} from '@/app/admin/internal/manage/actions'
import SubmitButton from '@/components/submit-button'
import type { InternalJob } from '@/lib/internal/jobs'

export type JobsLabels = {
  addTitle: string
  addHint: string
  name: string
  description: string
  add: string
  save: string
  visible: string
  visibleHint: string
  moveUp: string
  moveDown: string
  remove: string
  confirmRemove: string
  cancel: string
  loading: string
  empty: string
  hidden: string
  openJob: string
}

export default function JobsManager({
  jobs,
  labels,
}: {
  jobs: InternalJob[]
  labels: JobsLabels
}) {
  const [addState, addAction] = useActionState<JobsState, FormData>(createJob, {})

  return (
    <>
      <div className="card">
        <h2>{labels.addTitle}</h2>
        <p className="muted">{labels.addHint}</p>

        {addState.error ? <div className="alert error">{addState.error}</div> : null}

        <form action={addAction}>
          <div className="form-grid">
            <div className="field">
              <div className="label-row">
                <label htmlFor="new-title">
                  {labels.name}
                  <span className="req">*</span>
                </label>
              </div>
              <input id="new-title" name="titleAr" type="text" className="w-org" />
            </div>
            <div className="field">
              <div className="label-row">
                <label htmlFor="new-description">{labels.description}</label>
              </div>
              <textarea id="new-description" name="descriptionAr" rows={2} />
            </div>
          </div>
          <div className="actions">
            <SubmitButton loadingLabel={labels.loading}>{labels.add}</SubmitButton>
          </div>
        </form>
      </div>

      {jobs.length === 0 ? (
        <div className="card">
          <p className="muted">{labels.empty}</p>
        </div>
      ) : (
        jobs.map((job, index) => (
          <JobRow
            key={job.id}
            job={job}
            labels={labels}
            isFirst={index === 0}
            isLast={index === jobs.length - 1}
          />
        ))
      )}
    </>
  )
}

function JobRow({
  job,
  labels,
  isFirst,
  isLast,
}: {
  job: InternalJob
  labels: JobsLabels
  isFirst: boolean
  isLast: boolean
}) {
  const [saveState, saveAction] = useActionState<JobsState, FormData>(updateJob, {})
  const [moveState, moveAction] = useActionState<JobsState, FormData>(moveJob, {})
  const [removeState, removeAction] = useActionState<JobsState, FormData>(deleteJob, {})
  // removing is the one thing here that cannot be undone, so it asks twice
  const [confirming, setConfirming] = useState(false)

  const error = saveState.error ?? moveState.error ?? removeState.error

  return (
    <div className="card">
      <div className="job-head">
        <span className="job-title">
          {job.titleAr}
          {!job.active ? <span className="count-dot">{labels.hidden}</span> : null}
        </span>
        <div className="job-order">
          <form action={moveAction}>
            <input type="hidden" name="id" value={job.id} />
            <input type="hidden" name="direction" value="up" />
            <button
              type="submit"
              className="section-add"
              title={labels.moveUp}
              aria-label={labels.moveUp}
              disabled={isFirst}
            >
              ↑
            </button>
          </form>
          <form action={moveAction}>
            <input type="hidden" name="id" value={job.id} />
            <input type="hidden" name="direction" value="down" />
            <button
              type="submit"
              className="section-add"
              title={labels.moveDown}
              aria-label={labels.moveDown}
              disabled={isLast}
            >
              ↓
            </button>
          </form>
        </div>
      </div>

      {error ? <div className="alert error">{error}</div> : null}
      {saveState.ok ? <div className="alert ok">{saveState.ok}</div> : null}

      <form action={saveAction}>
        <input type="hidden" name="id" value={job.id} />
        <div className="form-grid">
          <div className="field">
            <div className="label-row">
              <label htmlFor={`${job.id}-title`}>
                {labels.name}
                <span className="req">*</span>
              </label>
            </div>
            <input
              id={`${job.id}-title`}
              name="titleAr"
              type="text"
              className="w-org"
              defaultValue={job.titleAr}
            />
          </div>

          <div className="field">
            <div className="label-row">
              <label htmlFor={`${job.id}-description`}>{labels.description}</label>
            </div>
            <textarea
              id={`${job.id}-description`}
              name="descriptionAr"
              rows={2}
              defaultValue={job.descriptionAr ?? ''}
            />
          </div>

          <div className="field">
            <div className="checkbox">
              <input
                id={`${job.id}-active`}
                name="active"
                type="checkbox"
                defaultChecked={job.active}
              />
              <div className="label-row">
                <label htmlFor={`${job.id}-active`}>{labels.visible}</label>
              </div>
            </div>
            <div className="hint">{labels.visibleHint}</div>
          </div>
        </div>

        <div className="actions">
          <SubmitButton loadingLabel={labels.loading}>{labels.save}</SubmitButton>
          <a className="btn secondary" href={`/admin/internal/${job.id}`}>
            {labels.openJob}
          </a>
        </div>
      </form>

      <div className="job-danger">
        {confirming ? (
          <form action={removeAction}>
            <input type="hidden" name="id" value={job.id} />
            <SubmitButton loadingLabel={labels.loading} className="btn danger">
              {labels.confirmRemove}
            </SubmitButton>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setConfirming(false)}
            >
              {labels.cancel}
            </button>
          </form>
        ) : (
          <button
            type="button"
            className="link-danger"
            onClick={() => setConfirming(true)}
          >
            {labels.remove}
          </button>
        )}
      </div>
    </div>
  )
}
