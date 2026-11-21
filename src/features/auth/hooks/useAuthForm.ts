import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { signIn, signUp } from "../api/authApi";
import { authErrorMessage } from "../logic/authErrors";
import { authSchemas } from "../logic/authSchema";
import type { AuthMode, Credentials } from "../types";

const submitByMode: Record<AuthMode, (credentials: Credentials) => Promise<void>> = {
  signIn,
  signUp,
};

/** Form state for the login screen. Both tabs share the fields, only the rules differ. */
export function useAuthForm(mode: AuthMode) {
  const { control, handleSubmit, setError, clearErrors, formState } = useForm<Credentials>({
    resolver: zodResolver(authSchemas[mode]),
    defaultValues: { email: "", password: "" },
  });

  // A hint from the other tab (e.g. "mindestens 8 Zeichen") would be wrong after switching.
  useEffect(() => clearErrors(), [mode, clearErrors]);

  const submit = handleSubmit(async (credentials) => {
    try {
      await submitByMode[mode](credentials);
      // No navigation here: the auth guard switches screens as soon as the session changes.
    } catch (error) {
      setError("root", { message: authErrorMessage(error) });
    }
  });

  return {
    control,
    submit,
    isSubmitting: formState.isSubmitting,
    /** Error from the server (wrong password, no network), shown above the button. */
    submitError: formState.errors.root?.message,
  };
}
