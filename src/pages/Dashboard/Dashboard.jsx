import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Table } from "../../components/ui";
import { reportService } from "../../services/reports";

const currencyFormatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-PK");

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatMoney(value) {
  return currencyFormatter.format(toNumber(value));
}

function formatCount(value) {
  return numberFormatter.format(toNumber(value));
}

function formatDate(value, options = { day: "numeric", month: "short" }) {
  if (!value) return "—";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-PK", options).format(date);
}

function formatMethod(method) {
  return method
    ? String(method)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "—";
}

function formatDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function MetricCard({ label, value, helper, tone = "bg-slate-500" }) {
  return (
    <Card className="min-h-36">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {label}
        </p>
        <span
          aria-hidden="true"
          className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${tone}`}
        />
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
        {helper}
      </p>
    </Card>
  );
}

function EmptyPanel({ children }) {
  return (
    <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
      {children}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await reportService.dashboard();
      setData(result || {});
      setLastUpdated(new Date());
    } catch (loadError) {
      setError(loadError?.message || "Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const collectionTrend = useMemo(() => {
    const trendByDate = new Map(
      (Array.isArray(data?.collectionTrend) ? data.collectionTrend : []).map(
        (item) => [String(item.date).slice(0, 10), item.total],
      ),
    );
    const today = new Date();

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - (6 - index),
      );
      const dateKey = formatDateKey(date);
      return { date: dateKey, total: trendByDate.get(dateKey) ?? 0 };
    });
  }, [data]);
  const recentPayments = Array.isArray(data?.recentPayments)
    ? data.recentPayments
    : [];
  const overdueItems = Array.isArray(data?.overdueItems)
    ? data.overdueItems
    : [];
  const highestCollection = Math.max(
    ...collectionTrend.map((item) => toNumber(item.total)),
    0,
  );
  const hasCollectionTrend = collectionTrend.some(
    (item) => toNumber(item.total) > 0,
  );
  const hasActivity = Boolean(
    toNumber(data?.todayDue) ||
      toNumber(data?.todayCollected) ||
      toNumber(data?.totalOutstanding) ||
      toNumber(data?.activePlans) ||
      toNumber(data?.overdueCount) ||
      toNumber(data?.overdueAmount) ||
      toNumber(data?.dueNext7Days) ||
      hasCollectionTrend ||
      recentPayments.length ||
      overdueItems.length,
  );

  if (loading && !data) {
    return (
      <Card className="py-12 text-center">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
          Loading dashboard…
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Preparing your collection and installment overview.
        </p>
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card className="py-12 text-center">
        <p className="text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
        <Button className="mt-4" onClick={loadDashboard}>
          Try again
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Collection, dues, and payment-plan overview.
          </p>
          {lastUpdated && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Last updated {lastUpdated.toLocaleTimeString("en-PK", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
        <Button onClick={loadDashboard} disabled={loading} className="shrink-0">
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
          {error} Showing the last available dashboard data.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Today's Due"
          value={formatMoney(data?.todayDue)}
          helper="Installments scheduled for collection today."
          tone="bg-amber-500"
        />
        <MetricCard
          label="Today's Collected"
          value={formatMoney(data?.todayCollected)}
          helper="Installment payments received today."
          tone="bg-emerald-500"
        />
        <MetricCard
          label="Total Outstanding"
          value={formatMoney(data?.totalOutstanding)}
          helper="Remaining installment balance, including late fees."
          tone="bg-brand"
        />
        <MetricCard
          label="Active Plans"
          value={formatCount(data?.activePlans)}
          helper="Customer payment plans currently in progress."
        />
        <MetricCard
          label="Overdue Installments"
          value={formatCount(data?.overdueCount)}
          helper={`${formatMoney(data?.overdueAmount)} needs follow-up.`}
          tone="bg-red-500"
        />
        <MetricCard
          label="Due in Next 7 Days"
          value={formatMoney(data?.dueNext7Days)}
          helper="Upcoming scheduled installment collections."
          tone="bg-amber-500"
        />
      </div>

      {!hasActivity && (
        <Card>
          <EmptyPanel>
            No collection or installment activity yet. New payment plans will
            appear here.
          </EmptyPanel>
        </Card>
      )}

      <Card>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Collections trend
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Daily installment payments received over the last 7 days.
            </p>
          </div>
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            {formatMoney(
              collectionTrend.reduce(
                (total, item) => total + toNumber(item.total),
                0,
              ),
            )}
          </p>
        </div>

        {hasCollectionTrend ? (
          <div className="mt-6 flex h-48 items-end gap-2 sm:gap-3">
            {collectionTrend.map((item, index) => {
              const amount = toNumber(item.total);
              const height =
                amount > 0 && highestCollection > 0
                  ? `${Math.max(8, Math.round((amount / highestCollection) * 100))}%`
                  : "2px";

              return (
                <div
                  key={`${item.date || "day"}-${index}`}
                  className="flex h-full min-w-0 flex-1 flex-col justify-end"
                  title={`${formatDate(item.date)}: ${formatMoney(amount)}`}
                >
                  <div className="flex flex-1 items-end rounded-t bg-gray-100 px-1 dark:bg-neutral-700">
                    <div
                      className="w-full rounded-t bg-emerald-500 transition-all"
                      style={{ height }}
                    />
                  </div>
                  <span className="mt-2 truncate text-center text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(item.date, { weekday: "short" })}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyPanel>
            No collection data is available for the last 7 days.
          </EmptyPanel>
        )}
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Attention required
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Installments that are past their due date.
              </p>
            </div>
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-300">
              {formatCount(data?.overdueCount)} overdue
            </span>
          </div>

          {overdueItems.length ? (
            <div className="mt-4 overflow-x-auto">
              <Table
                headers={[
                  "Customer",
                  "Installment",
                  "Due date",
                  "Days late",
                  "Outstanding",
                ]}
              >
                {overdueItems.map((item, index) => (
                  <tr
                    key={`${item.customer_name || "customer"}-${item.installment_no || index}-${item.due_date || index}`}
                  >
                    <td className="py-3 pr-4 font-medium text-gray-900 dark:text-gray-100">
                      {item.customer_name || "—"}
                    </td>
                    <td className="py-3 pr-4">#{item.installment_no ?? "—"}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {formatDate(item.due_date)}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap text-red-600 dark:text-red-400">
                      {formatCount(item.days_overdue)} days
                    </td>
                    <td className="py-3 whitespace-nowrap font-semibold text-red-600 dark:text-red-400">
                      {formatMoney(item.outstanding)}
                    </td>
                  </tr>
                ))}
              </Table>
            </div>
          ) : (
            <EmptyPanel>Great—there are no overdue installments.</EmptyPanel>
          )}
        </Card>

        <Card>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Recent collections
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Latest installment payments recorded in the system.
            </p>
          </div>

          {recentPayments.length ? (
            <div className="mt-4 overflow-x-auto">
              <Table
                headers={[
                  "Customer",
                  "Installment",
                  "Date",
                  "Method",
                  "Amount",
                ]}
              >
                {recentPayments.map((payment, index) => (
                  <tr
                    key={`${payment.customer_name || "payment"}-${payment.installment_no || index}-${payment.payment_date || index}`}
                  >
                    <td className="py-3 pr-4 font-medium text-gray-900 dark:text-gray-100">
                      {payment.customer_name || "—"}
                    </td>
                    <td className="py-3 pr-4">
                      #{payment.installment_no ?? "—"}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {formatDate(payment.payment_date)}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {formatMethod(payment.payment_method)}
                    </td>
                    <td className="py-3 whitespace-nowrap font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatMoney(payment.amount)}
                    </td>
                  </tr>
                ))}
              </Table>
            </div>
          ) : (
            <EmptyPanel>No payments have been collected yet.</EmptyPanel>
          )}
        </Card>
      </div>
    </div>
  );
}
