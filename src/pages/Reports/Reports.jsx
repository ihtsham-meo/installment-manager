import { useState } from "react";
import { reportService } from "../../services/reports";

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

  return (
    <div>
      <h2>Reports</h2>
      <nav>
        <button onClick={() => load("collections")}>Collections</button>
        <button onClick={() => load("defaulters")}>Defaulters</button>
        <button onClick={() => load("productSales")}>Product Sales</button>
        <button onClick={() => load("profit")}>Profit</button>
      </nav>

      {tab === "collections" && (
        <div>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <button onClick={() => load("collections")}>Refresh</button>
        </div>
      )}

      <button onClick={handleExport} disabled={rows.length === 0}>
        Export CSV
      </button>

      <table>
        <thead>
          <tr>
            {rows[0] && Object.keys(rows[0]).map((k) => <th key={k}>{k}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {Object.values(r).map((v, j) => (
                <td key={j}>{String(v)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
