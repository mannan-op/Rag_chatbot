import { getSupabaseClient } from "../lib/supabase";
import api from "./api";

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signUpWithPassword(fullName: string, email: string, password: string) {
  const normalizedEmail = email.trim();
  const useDevelopmentSignup =
    import.meta.env.DEV && import.meta.env.VITE_DEV_AUTO_CONFIRM_EMAIL === "true";

  if (useDevelopmentSignup) {
    await api.post("/api/auth/dev-signup", {
      fullName: fullName.trim(),
      email: normalizedEmail,
      password,
    });

    return signInWithPassword(normalizedEmail, password);
  }

  const { data, error } = await getSupabaseClient().auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        full_name: fullName.trim(),
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOutCurrentUser() {
  const { error } = await getSupabaseClient().auth.signOut();

  if (error) {
    throw error;
  }
}
