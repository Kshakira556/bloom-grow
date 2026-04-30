type Props = {
  trialEndsAt?: string | Date | null;
};

const getEndDate = (trialEndsAt?: string | Date | null): Date | null => {
  if (!trialEndsAt) return null;

  const endDate = trialEndsAt instanceof Date ? trialEndsAt : new Date(trialEndsAt);
  return Number.isNaN(endDate.getTime()) ? null : endDate;
};

export default function TrialBanner({ trialEndsAt }: Props) {
  const endDate = getEndDate(trialEndsAt);
  if (!endDate) return null;

  const now = new Date();
  const diffMs = endDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return (
      <div className="bg-red-100 text-red-800 p-3 rounded-md mb-4">
        Trial ended. Upgrade to continue using CUB.
      </div>
    );
  }

  const totalHoursLeft = Math.ceil(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(totalHoursLeft / 24);
  const diffHours = totalHoursLeft % 24;

  return (
    <div className="bg-yellow-100 text-yellow-900 p-3 rounded-md mb-4">
      Trial active: {diffDays}d {diffHours}h remaining
      <br />
      <span className="text-sm">Ends on {endDate.toLocaleString()}</span>
    </div>
  );
}
