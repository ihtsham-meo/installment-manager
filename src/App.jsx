import { useEffect, useState } from "react";
import { authService } from "./services/auth";
import { licenseService } from "./services/license";
import { settingsService } from "./services/settings";
import License from "./pages/License/License.jsx";
import Setup from "./pages/Auth/Setup.jsx";
import Login from "./pages/Auth/Login.jsx";
import Layout from "./components/Layout.jsx";
import Products from "./pages/Products/Products.jsx";
import Customers from "./pages/Customers/Customers.jsx";
import Sales from "./pages/Sales/Sales.jsx";
import Payments from "./pages/Payments/Payments.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import Reports from "./pages/Reports/Reports.jsx";
import Backup from "./pages/Backup/Backup.jsx";
import Users from "./pages/Users/Users.jsx";
import Settings from "./pages/Settings/Settings.jsx";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState("Installment Manager");
  const [licenseStatus, setLicenseStatus] = useState(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");

  const bootstrap = async () => {
    const settings = await settingsService.get();
    if (settings.business_name) setBusinessName(settings.business_name);

    const license = await licenseService.status();
    setLicenseStatus(license);
    if (!license.activated) {
      setLoading(false);
      return;
    }

    const setup = await authService.needsSetup();
    if (setup) {
      setNeedsSetup(true);
      setLoading(false);
      return;
    }
    setUser(await authService.current());
    setLoading(false);
  };
  useEffect(() => {
    bootstrap();
  }, []);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!licenseStatus.activated)
    return <License status={licenseStatus} onActivated={bootstrap} />;
  if (needsSetup)
    return (
      <Setup onDone={() => setNeedsSetup(false)} businessName={businessName} />
    );
  if (!user) return <Login onLogin={setUser} businessName={businessName} />;

  const isAdmin = user.role === "admin";

  return (
    <Layout
      user={user}
      page={page}
      setPage={setPage}
      isAdmin={isAdmin}
      businessName={businessName}
      onLogout={async () => {
        await authService.logout();
        setUser(null);
      }}
    >
      {page === "dashboard" && <Dashboard />}
      {page === "products" && <Products />}
      {page === "customers" && <Customers />}
      {page === "sales" && <Sales />}
      {page === "payments" && <Payments />}
      {page === "reports" && <Reports />}
      {page === "backup" && <Backup />}
      {page === "users" && isAdmin && <Users />}
      {page === "settings" && (
        <Settings
          user={user}
          onProfileUpdate={setUser}
          onBusinessNameUpdate={setBusinessName}
        />
      )}
    </Layout>
  );
}
