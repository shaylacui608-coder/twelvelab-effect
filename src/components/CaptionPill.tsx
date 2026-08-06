export function CaptionPill({ label }: { label: string }) {
  return (
    <div className="caption">
      <span className="caption__pill">{label}</span>
      <span className="caption__tick" aria-hidden />
    </div>
  );
}
