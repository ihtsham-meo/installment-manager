import { useEffect, useState } from "react";
import { backupService } from "../../services/backup";
import { Card, Button, Input, Table } from "../../components/ui";

export default function Backup() {
  const [passphrase, setPassphrase] = useState("");
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const loadHistory = async () => setHistory(await backupService.list());
  useEffect(() => {
    loadHistory();
  }, []);

  const handleBackup = async () => {
    if (!passphrase) return setMessage("Enter a passphrase first.");
    setBusy(true);
    try {
      const result = await backupService.create(passphrase);
      setMessage(
        result.canceled ? "Backup canceled." : `Backup saved: ${result.path}`,
      );
      loadHistory();
    } catch (err) {
      setMessage(`Backup failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    if (!passphrase) return setMessage("Enter the backup's passphrase first.");
    const ok = window.confirm(
      "Restoring replaces ALL current data with the backup. A safety backup is taken first. Continue?",
    );
    if (!ok) return;
    setBusy(true);
    try {
      const result = await backupService.restore(passphrase);
      setMessage(
        result.canceled
          ? "Restore canceled."
          : `Restore complete. Safety backup: ${result.safetyBackup}`,
      );
    } catch (err) {
      setMessage(`Restore failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Backup & Restore</h2>
      <Card className="space-y-3">
        {message && <p className="text-sm">{message}</p>}
        <Input
          type="password"
          placeholder="Backup passphrase"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
        />
        <div className="flex gap-2">
          <Button onClick={handleBackup} disabled={busy}>
            Backup Now (pick local folder or USB drive)
          </Button>
          <Button variant="secondary" onClick={handleRestore} disabled={busy}>
            Restore From Backup
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold mb-3">Backup History</h3>
        <Table headers={["Path", "Type", "Size", "Date"]}>
          {history.map((b) => (
            <tr key={b.id}>
              <td className="py-2 pr-4 truncate max-w-xs">{b.backup_path}</td>
              <td className="py-2 pr-4 capitalize">{b.backup_type}</td>
              <td className="py-2 pr-4">{b.size_bytes}</td>
              <td className="py-2 pr-4">{b.created_at}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
