/**
 * Launch-Schalter: LAUNCH_MODE=live schaltet die öffentliche Strecke frei,
 * jeder andere Wert (oder keiner) bedeutet Coming-Soon. Wirkt nur auf die
 * öffentlichen Einstiegspunkte – die eingeloggte App bleibt unberührt,
 * eine vorhandene Session ist immer Vollzugang.
 *
 * Launch am 12.08.: LAUNCH_MODE=live in Railway setzen → Redeploy.
 */
export function istComingSoon(): boolean {
  return process.env.LAUNCH_MODE !== "live";
}
