const DEMO_SESSION_KEY = "familylink-demo-authenticated";

export function isDemoAuthenticated() {
  return typeof window !== "undefined" && window.sessionStorage.getItem(DEMO_SESSION_KEY) === "true";
}

export function setDemoAuthenticated(authenticated: boolean) {
  if (authenticated) {
    window.sessionStorage.setItem(DEMO_SESSION_KEY, "true");
  } else {
    window.sessionStorage.removeItem(DEMO_SESSION_KEY);
  }
}
