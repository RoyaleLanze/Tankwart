// Stellt ein globales, persistentes localStorage bereit (ADR 0010).
import "expo-sqlite/localStorage/install";

import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Supabase-Konfiguration fehlt: .env aus .env.example anlegen und App neu starten.",
  );
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Auf Android gibt es keine URL, aus der eine Session gelesen werden könnte.
    detectSessionInUrl: false,
  },
});

// Token nur im Vordergrund erneuern, laut Supabase-Doku für mobile Apps empfohlen.
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
