export const auth = {
  "auth.signIn.title": "Sign in",
  "auth.signIn.submit": "Sign in",
  "auth.email": "Work email",
  "auth.password": "Password",

  "auth.totp.title": "Two-step verification",
  "auth.totp.description":
    "Open your authenticator app. Codes sent by email or SMS are not accepted.",
  "auth.totp.verify": "Verify",
  "auth.backToSignIn": "Back to sign in",
  "auth.invite.title": "Set up your account",
  "auth.invite.welcome":
    "Welcome, {name}. You have been invited as {role}. Choose a password to finish.",
  "auth.invite.rules":
    "8 to 20 characters with upper and lower case letters, a number and a symbol.",
  "auth.invite.confirm": "Confirm password",
  "auth.invite.mismatch": "The passwords do not match.",
  "auth.invite.submit": "Create account",
  "auth.invite.done":
    "Your account is ready. Sign in with your new password; you will then set up your authenticator app.",
  "auth.invite.invalid":
    "This invitation link is not valid. It may have expired or already been used. Ask an administrator to send a new one.",
  "auth.invite.rule.short": "Use at least 8 characters.",
  "auth.invite.rule.long": "Use no more than 20 characters.",
  "auth.invite.rule.lower": "Add a lower case letter.",
  "auth.invite.rule.upper": "Add an upper case letter.",
  "auth.invite.rule.digit": "Add a number.",
  "auth.invite.rule.symbol": "Add a symbol such as ! or @.",
  "auth.totp.remaining": "{count} attempts left.",
  "auth.totp.locked": "Too many wrong codes. Sign-in is locked for 15 minutes.",

  "auth.enrol.title": "Set up your authenticator",
  "auth.enrol.description":
    "Scan the QR code in an authenticator app, or type the setup key. Access stays blocked until you confirm a code.",
  "auth.enrol.qrLabel": "QR code for your authenticator app",
  "auth.enrol.issuer": "Issuer",
  "auth.enrol.account": "Account",
  "auth.enrol.setupKey": "Setup key",
  "auth.enrol.confirm": "Enter a code to confirm",
  "auth.enrol.submit": "Confirm and continue",

  "auth.idle.title": "Still there?",
  "auth.idle.countdownLabel": "{seconds} seconds left",
  "auth.idle.stay": "Stay signed in",
  "auth.idle.message":
    "You have been inactive, so we will sign you out to keep your account safe. Anything you have typed is kept if you stay.",

  "security.title": "Profile",
  "security.description": "Your sign-in, authenticator and active sessions.",
  "security.profile": "Profile",
  "security.name": "Name",
  "security.roles": "Roles",
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
