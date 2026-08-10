export function formatNlsRegistrationId(registrationNumber: number): string {
  return `NLS-ETSCROC-${String(registrationNumber).padStart(4, "0")}`;
}
