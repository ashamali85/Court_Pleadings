export type RequestStatusValue = 'SUBMITTED' | 'UNDER_REVIEW' | 'GENERATED' | 'REJECTED'

export function statusBadge(status: RequestStatusValue | string) {
  switch (status) {
    case 'SUBMITTED':
      return { labelAr: 'قيد الانتظار', className: 'submitted' }
    case 'UNDER_REVIEW':
      return { labelAr: 'قيد المراجعة', className: 'review' }
    case 'GENERATED':
      return { labelAr: 'تم إصدار الصحيفة', className: 'generated' }
    case 'REJECTED':
      return { labelAr: 'مرفوض', className: 'rejected' }
    default:
      return { labelAr: status, className: 'submitted' }
  }
}
