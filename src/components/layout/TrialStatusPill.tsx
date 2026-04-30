type Props = {
  trialEndsAt: string | Date | null;
};

const getEndDate = (trialEndsAt: string | Date | null): Date | null => {
  if (!trialEndsAt) return null;

  const endDate = trialEndsAt instanceof Date ? trialEndsAt : new Date(trialEndsAt);
  return Number.isNaN(endDate.getTime()) ? null : endDate;
};

export function TrialStatusPill({ trialEndsAt }: Props) {
  const endDate = getEndDate(trialEndsAt);
  if (!endDate) return null;

  const now = new Date();
  const diffMs = endDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return (
      <div className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
        Trial ended
      </div>
    );
  }

  const totalHoursLeft = Math.ceil(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(totalHoursLeft / 24);
  const diffHours = totalHoursLeft % 24;
  const isUrgent = totalHoursLeft < 24;

  return (
    <div
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        isUrgent ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-800"
      }`}
    >
      {isUrgent ? `Trial: ${totalHoursLeft}h left` : `Trial: ${diffDays}d ${diffHours}h left`}
    </div>
  );
}
