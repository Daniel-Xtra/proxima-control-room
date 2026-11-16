export const auth = {
  "auth.signIn.title": "Sign in",
  "auth.signIn.submit": "Sign in",
  "auth.email": "Work email",
  "auth.password": "Password",
  "auth.demoRole": "Preview as role (demo only)",
  "auth.demoHint":
    "Switch role to see how the menu and actions change. Not part of the real sign-in.",

  "auth.totp.title": "Two-step verification",
  "auth.totp.description":
    "Open your authenticator app. Codes sent by email or SMS are not accepted.",
  "auth.totp.verify": "Verify",
  "auth.totp.remaining": "{count} attempts left.",
  "auth.totp.locked": "Too many wrong codes. Sign-in is locked for 15 minutes.",

  "auth.password.title": "Set a new password",
  "auth.password.description":
    "Your temporary password has to be replaced. Use at least 10 characters.",
  "auth.password.new": "New password",

  "auth.enrol.title": "Set up your authenticator",
  "auth.enrol.description":
    "Scan the QR code in an authenticator app, or type the setup key. Access stays blocked until you confirm a code.",
  "auth.enrol.qrLabel": "QR code shown here by the backend",
  "auth.enrol.issuer": "Issuer",
  "auth.enrol.account": "Account",
  "auth.enrol.setupKey": "Setup key",
  "auth.enrol.confirm": "Enter a code to confirm",
  "auth.enrol.submit": "Confirm and continue",

  "auth.idle.title": "Still there?",
  "auth.idle.description": "You will be signed out in {seconds} seconds because of inactivity.",
  "auth.idle.stay": "Stay signed in",
  "auth.idle.body": "Anything you have typed is kept if you stay signed in.",

  "security.title": "Security settings",
  "security.description": "Your sign-in, authenticator and active sessions.",
  "security.profile": "Profile",
  "security.name": "Name",
  "security.roles": "Roles",
  "security.lastLogin": "Last login",
  "security.twoFactor": "Two-factor authentication",
  "security.twoFactorHint": "Authenticator app (TOTP).",
  "security.enrolled": "Enrolled",
  "security.notEnrolled": "Not enrolled",
  "security.sessions": "Active sessions",
  "security.signOutOthers": "Sign out other sessions",
  "security.signOutImpact": "Every other device is signed out straight away.",
  "security.signedOutOthers": "Other sessions signed out",
  "security.device": "Device",
  "security.lastActive": "Last active",
  "security.thisDevice": "This device",
  "security.signedIn": "Signed in",
} as const;
