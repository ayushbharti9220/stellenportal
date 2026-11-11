// Turns Supabase error messages into short, friendly sentences.
export function friendlyAuthError(error) {
  const text = `${error?.code || ""} ${error?.message || ""}`.toLowerCase();

  if (text.includes("invalid login credentials")) return "Email or password is incorrect.";
  if (text.includes("email not confirmed")) return "Please confirm your email first. Check your inbox.";
  if (text.includes("failed to fetch") || text.includes("network")) {
    return "Could not reach Supabase. Check your internet connection and try again.";
  }
  if (text.includes("signup") && text.includes("not allowed")) {
    return "Sign-ups are turned off in Supabase. Turn on 'Allow new users to sign up' in Authentication settings.";
  }
  if (text.includes("already registered") || text.includes("user_already_exists")) {
    return "An account with this email already exists. Please log in instead.";
  }
  if (text.includes("rate limit")) {
    return "Too many emails were sent. Wait a few minutes, or turn off 'Confirm email' in Supabase while developing.";
  }
  if (text.includes("password")) return error.message;
  return error?.message || "Something went wrong. Please try again.";
}

// Turns database errors into short, friendly sentences.
export function friendlyDbError(error) {
  const text = `${error?.code || ""} ${error?.message || ""}`.toLowerCase();

  if (error?.code === "42501" || text.includes("row-level security")) {
    return "You do not have permission to do this. Check that you are logged in with the right account type.";
  }
  if (error?.code === "23505") return "This record already exists.";
  if (text.includes("column") || text.includes("relation") || text.includes("schema cache")) {
    return "The database is not updated yet. Run database/phase5-migration.sql in the Supabase SQL Editor.";
  }
  if (text.includes("failed to fetch")) return "Could not reach Supabase. Check your internet connection.";
  return error?.message || "Something went wrong. Please try again.";
}
