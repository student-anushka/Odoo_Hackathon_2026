export default function ExpiryBanner({ alerts }) {
  if (!alerts || alerts.length === 0) return null;

  const expiredCount = alerts.filter((a) => a.isExpired).length;
  const expiringCount = alerts.length - expiredCount;

  return (
    <div className="banner">
      <span>⚠</span>
      <span>
        <strong>{alerts.length} driver license{alerts.length > 1 ? "s" : ""}</strong>{" "}
        need attention —{" "}
        {expiredCount > 0 && (
          <>
            <strong>{expiredCount} expired</strong>
            {expiringCount > 0 ? ", " : ""}
          </>
        )}
        {expiringCount > 0 && (
          <>
            <strong>{expiringCount}</strong> expiring within 30 days
          </>
        )}
      </span>
    </div>
  );
}
