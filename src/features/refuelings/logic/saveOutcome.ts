// What a save attempt means for the form: whether to leave, and which error to show where.
import { formFieldOf } from "./formSchema";
import type { RefuelingFormValues } from "./formValues";
import type { SaveFieldError } from "./saveError";

/** How one save attempt ended; the form turns it into what the user sees. */
export type SaveOutcome =
  | { status: "saved" }
  | { status: "fieldError"; error: SaveFieldError }
  // An earlier attempt saved other values; the user edits that refueling in the list.
  | { status: "differs"; message: string }
  | { status: "failed"; message: string };

/** An error to put on the form: at one field (with focus) or on "root", above the button. */
export type FormError = {
  name: keyof RefuelingFormValues | "root";
  message: string;
  shouldFocus: boolean;
};

export type SaveFormState = {
  /** True if the refueling is stored, so the caller can leave. */
  saved: boolean;
  /** Null if there is nothing to show. */
  error: FormError | null;
};

/**
 * The form state after a save attempt. The form keeps every value, so the user can try again
 * without typing anything (M15).
 */
export function formStateOf(outcome: SaveOutcome): SaveFormState {
  switch (outcome.status) {
    case "saved":
      return { saved: true, error: null };
    case "fieldError":
      return {
        saved: false,
        error: {
          name: formFieldOf(outcome.error.field),
          message: outcome.error.code,
          shouldFocus: true,
        },
      };
    case "failed":
    case "differs":
      return {
        saved: false,
        error: { name: "root", message: outcome.message, shouldFocus: false },
      };
  }
}
