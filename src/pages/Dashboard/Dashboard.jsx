import { useEffect, useState } from "react";
import { reportService } from "../../services/reports";

function Card({ label, value }) {
  return (
    <div
      style={{ border: "1px solid #ccc", padding: "12px", minWidth: "150px" }}
    >
      <div>{label}</div>
      <strong>{value}</strong>
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
      <h2>Dashboard</h2>
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <Card label="Today's Due" value={data.todayDue} />
        <Card label="Today's Collected" value={data.todayCollected} />
        <Card label="Total Outstanding" value={data.totalOutstanding} />
        <Card label="Active Plans" value={data.activePlans} />
        <Card label="Overdue Installments" value={data.overdueCount} />
      </div>
    </div>
  );
}
