import { useEffect, useState } from "react";
import { settingsService } from "../../services/settings";
import { userService } from "../../services/users";
import { Card, Button, Input, ErrorText } from "../../components/ui";

export default function Settings({
  user,
  onProfileUpdate,
  onBusinessNameUpdate,
}) {
  const [businessName, setBusinessName] = useState("");
  const [fullName, setFullName] = useState(user.full_name);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    settingsService.get().then((s) => setBusinessName(s.business_name || ""));
  }, []);

  const saveBusinessName = async () => {
    try {
      await settingsService.update("business_name", businessName);
      onBusinessNameUpdate(businessName);
      setMessage("Business name updated.");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const saveProfile = async () => {
    try {
      await userService.update({
        id: user.id,
        full_name: fullName,
        role: user.role,
        active: true,
      });
      onProfileUpdate({ ...user, full_name: fullName });
      setMessage("Profile updated.");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const changePassword = async () => {
    try {
      await userService.changeOwnPassword({ oldPassword, newPassword });
      setOldPassword("");
      setNewPassword("");
      setMessage("Password changed.");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Settings</h2>
      {message && <p className="text-green-600 text-sm">{message}</p>}
      <ErrorText>{error}</ErrorText>

      {user.role === "admin" && (
        <Card className="space-y-3">
          <h3 className="font-semibold">Business Name</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Shown in the sidebar, login screen, and window title.
          </p>
          <Input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
          <Button onClick={saveBusinessName}>Save Business Name</Button>
        </Card>
      )}

      <Card className="space-y-3">
        <h3 className="font-semibold">My Profile</h3>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Button onClick={saveProfile}>Save Profile</Button>
      </Card>

      <Card className="space-y-3">
        <h3 className="font-semibold">Change Password</h3>
        <Input
          type="password"
          placeholder="Current password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
        />
        <Input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <Button onClick={changePassword}>Change Password</Button>
      </Card>
    </div>
  );
}

