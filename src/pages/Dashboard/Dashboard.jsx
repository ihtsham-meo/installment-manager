import { useEffect, useState } from "react";
import { reportService } from "../../services/reports";

function Card({ label, value }) {
  return (
    <div className="border border-gray-200 dark:border-neutral-700 rounded-lg p-4 min-w-[160px] bg-white dark:bg-neutral-800 shadow-sm">
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      <strong className="text-2xl">{value}</strong>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => {
    reportService.dashboard().then(setData);
  }, []);
  if (!data) return <p>Loading...</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Dashboard</h2>
      <div className="flex gap-4 flex-wrap">
        <Card label="Today's Due" value={data.todayDue} />
        <Card label="Today's Collected" value={data.todayCollected} />
        <Card label="Total Outstanding" value={data.totalOutstanding} />
        <Card label="Active Plans" value={data.activePlans} />
        <Card label="Overdue Installments" value={data.overdueCount} />
      </div>
    </div>
  );
}
