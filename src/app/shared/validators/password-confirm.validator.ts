import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export function matchFields(
  field: string,
  confirmField: string,
  errorKey = "fieldsMismatch",
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const a = group.get(field);
    const b = group.get(confirmField);
    if (!a || !b) return null; // controls not ready yet

    const aVal = a.value;
    const bVal = b.value;

    // only flag when both have values (optional)
    if (aVal == null || bVal == null || bVal === "") return null;

    return aVal === bVal ? null : { [errorKey]: true };
  };
}
