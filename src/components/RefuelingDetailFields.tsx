import type { Control, UseFormSetFocus } from "react-hook-form";
import { useTranslation } from "react-i18next";

import type { RefuelingFormValues } from "@/features/refuelings/logic/formValues";
import { refuelingErrorText } from "@/features/refuelings/messages";
import type { RefuelingInput } from "@/features/refuelings/types";

import { FormSwitch } from "./FormSwitch";
import { FormTextField } from "./FormTextField";

type Props = {
  control: Control<RefuelingFormValues, unknown, RefuelingInput>;
  setFocus: UseFormSetFocus<RefuelingFormValues>;
};

/** Station, the two switches and the note: what a refueling needs besides amounts and odometer. */
export function RefuelingDetailFields({ control, setFocus }: Props) {
  const { t } = useTranslation();

  return (
    <>
      <FormTextField
        control={control}
        name="stationName"
        label={t("refuelingForm.station")}
        icon="gas-station"
        errorText={refuelingErrorText}
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={() => setFocus("note")}
      />
      <FormSwitch control={control} name="isFullTank" label={t("refuelingForm.fullTank")} />
      <FormSwitch
        control={control}
        name="previousMissed"
        label={t("refuelingForm.previousMissed")}
        description={t("refuelingForm.previousMissedHint")}
      />
      <FormTextField
        control={control}
        name="note"
        label={t("refuelingForm.note")}
        icon="note-text-outline"
        errorText={refuelingErrorText}
        multiline
      />
    </>
  );
}
