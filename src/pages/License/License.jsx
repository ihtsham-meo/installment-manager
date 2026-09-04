import { useState } from "react";
import { licenseService } from "../../services/license";
import { Card, Button, Input, ErrorText } from "../../components/ui";

export default function License({ status, onActivated }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleActivate = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await licenseService.activate(key);
      onActivated();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-900">
      <Card className="w-[420px] space-y-3">
        <h2 className="text-lg font-bold text-brand">License Required</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Send this Machine ID to get a license key:
        </p>
        <code className="block bg-gray-100 dark:bg-neutral-900 p-2 rounded text-xs break-all">
          {status.machineId}
        </code>
        <ErrorText>{error}</ErrorText>
        <form onSubmit={handleActivate} className="space-y-3">
          <Input
            placeholder="Paste license key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            required
          />
          <Button type="submit" disabled={busy} className="w-full">
            Activate
          </Button>
        </form>
      </Card>
    </div>
  );
}
