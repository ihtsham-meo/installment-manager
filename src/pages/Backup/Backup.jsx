import { useEffect, useState } from "react";
import { backupService } from "../../services/backup";

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
    <div>
      <h2>Backup & Restore</h2>
      {message && <p>{message}</p>}
      <input
        type="password"
        placeholder="Backup passphrase"
        value={passphrase}
        onChange={(e) => setPassphrase(e.target.value)}
      />
      <button onClick={handleBackup} disabled={busy}>
        Backup Now (pick local folder or USB drive)
      </button>
      <button onClick={handleRestore} disabled={busy}>
        Restore From Backup
      </button>

      <h3>Backup History</h3>
      <table>
        <thead>
          <tr>
            <th>Path</th>
            <th>Type</th>
            <th>Size</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {history.map((b) => (
            <tr key={b.id}>
              <td>{b.backup_path}</td>
              <td>{b.backup_type}</td>
              <td>{b.size_bytes}</td>
              <td>{b.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
