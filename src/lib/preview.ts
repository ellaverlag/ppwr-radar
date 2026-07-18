/**
 * Preview-Modus: Wenn PREVIEW_MODE=true gesetzt ist, liest die
 * Wissensbasis-Schicht ungefiltert über den Service-Role-Client –
 * inklusive Inhalten, die noch nicht freigegeben sind.
 */
export function isPreviewMode(): boolean {
  return process.env.PREVIEW_MODE === "true";
}
