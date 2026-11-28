import { useNavigation, usePreventRemove } from "expo-router";

/**
 * Saves with `submit` (see useRefuelingForm) and goes back once it is saved. Going back is
 * blocked while saving: the answer would otherwise arrive at a closed screen.
 */
export function useSaveAndLeave(submit: () => Promise<boolean>, isSubmitting: boolean) {
  const navigation = useNavigation();
  const allowLeaving = usePreventRemove(isSubmitting);

  return async function saveAndLeave() {
    if (!(await submit())) return;
    // Not focused anymore, e.g. after a sign-out while saving: nothing to close.
    if (!navigation.isFocused()) return;
    allowLeaving();
    navigation.goBack();
  };
}
