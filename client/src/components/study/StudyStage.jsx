export default function StudyStage({ status = null, children, footer = null, notice = null }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {status}
      <div className="study-stage-body flex flex-1 flex-col gap-2">
        {children}
      </div>
      <div className="flex min-h-14 items-center">{footer}</div>
      {notice}
    </div>
  )
}
