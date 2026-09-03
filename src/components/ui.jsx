export function Card({ children, className = "" }) {
  return (
    <div
      className={`border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 shadow-sm p-4 ${className}`}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const base = "px-3 py-1.5 rounded text-sm font-medium transition";
  const variants = {
    primary: "bg-brand text-white hover:bg-brand-dark disabled:opacity-50",
    secondary:
      "bg-gray-100 dark:bg-neutral-700 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-neutral-600",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Input(props) {
  return (
    <input
      {...props}
      className={`border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 rounded px-3 py-1.5 text-sm w-full ${props.className || ""}`}
    />
  );
}

export function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className={`border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 rounded px-3 py-1.5 text-sm w-full ${props.className || ""}`}
    >
      {children}
    </select>
  );
}

export function Table({ headers, children }) {
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="text-left border-b border-gray-200 dark:border-neutral-700 text-gray-500 dark:text-gray-400">
          {headers.map((h) => (
            <th key={h} className="py-2 pr-4 font-medium">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
        {children}
      </tbody>
    </table>
  );
}

export function ErrorText({ children }) {
  if (!children) return null;
  return (
    <p className="text-red-600 dark:text-red-400 text-sm mb-2">{children}</p>
  );
}
