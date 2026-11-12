/** The deadline comes from an authorized server snapshot, never from a UI plan choice. */
export function assertOfflineAccess(accessExpiresAt?: string | null): void {
  if (accessExpiresAt === null) return;
  if (accessExpiresAt === undefined) throw new Error("Conéctate para actualizar esta descarga y verificar la vigencia de tu acceso.");
  const deadline = Date.parse(accessExpiresAt);
  if (!Number.isFinite(deadline) || deadline <= Date.now()) {
    throw new Error("El acceso de tu plan a este curso venció. Conéctate para actualizar tu suscripción y tus descargas.");
  }
}
