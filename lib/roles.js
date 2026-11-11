// Where each type of user lands after logging in
export function roleHome(role) {
  if (role === "admin") return "/admin";
  if (role === "employer") return "/employer";
  return "/";
}

// Only allow redirects to pages inside this website
export function safeNext(value) {
  if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return null;
}
