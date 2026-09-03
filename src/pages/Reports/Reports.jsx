import { useState } from "react";
import { reportService } from "../../services/reports";
import { Card, Button, Input } from "../../components/ui";

export default function Reports() {
  const [tab, setTab] = useState("collections");
  const [from, setFrom] = useState(
    new Date(new Date().setDate(1)).toISOString().slice(0, 10),
  );
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState([]);

  const load = async (which) => {
    setTab(which);
    let data = [];
    if (which === "collections")
      data = await reportService.collections({ from, to });
    if (which === "defaulters") data = await reportService.defaulters();
    if (which === "productSales") data = await reportService.productSales();
    if (which === "profit") data = await reportService.profit();
    setRows(data);
  };

  const handleExport = async () =>
    reportService.exportCsv({ filename: `${tab}.csv`, rows });

  const tabs = [
    { key: "collections", label: "Collections" },
    { key: "defaulters", label: "Defaulters" },
    { key: "productSales", label: "Product Sales" },
    { key: "profit", label: "Profit" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Reports</h2>
      <div className="flex gap-2">
        {tabs.map((t) => (
          <Button
            key={t.key}
            variant={tab === t.key ? "primary" : "secondary"}
            onClick={() => load(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {tab === "collections" && (
        <Card className="flex gap-3 items-end">
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <Button onClick={() => load("collections")}>Refresh</Button>
        </Card>
      )}

      <Button
        variant="secondary"
        onClick={handleExport}
        disabled={rows.length === 0}
      >
        Export CSV
      </Button>

      <Card>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b border-gray-200 dark:border-neutral-700 text-gray-500 dark:text-gray-400">
              {rows[0] &&
                Object.keys(rows[0]).map((k) => (
                  <th key={k} className="py-2 pr-4 font-medium">
                    {k}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
            {rows.map((r, i) => (
              <tr key={i}>
                {Object.values(r).map((v, j) => (
                  <td key={j} className="py-2 pr-4">
                    {String(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
