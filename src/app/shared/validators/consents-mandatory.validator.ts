import { AbstractControl, FormGroup, ValidationErrors } from "@angular/forms";

export function consentsMandatory(group: AbstractControl): ValidationErrors | null {
  const g = group as FormGroup;
  const rc = g.get("insuranceRC")?.value === true;
  const reg = g.get("internalRules")?.value === true;
  return rc && reg ? null : { missingConsent: true };
}
