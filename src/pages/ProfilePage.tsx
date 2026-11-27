import { useState, type FormEvent } from "react";
import { FormField } from "../components/auth/FormField";
import { StudentPageHeader } from "../components/student/StudentPageHeader";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { ErrorState } from "../components/ui/ErrorState";
import { PageLoader } from "../components/ui/PageLoader";
import { useMyProfile, useUpdateMyProfile } from "../hooks/useStudent";
import { userErrorMessage } from "../services/api";
import { AvatarPicker } from "../components/account/AvatarPicker";
import type { UserProfile } from "../types/student.types";
import { AccountDeletionPanel } from "../components/account/AccountDeletionPanel";
import { SubscriptionPanel } from "../components/subscription/SubscriptionPanel";

type ProfileFormFields = Pick<UserProfile, "fullName" | "phone" | "country" | "bio">;

interface ProfileFormProps {
  profile: UserProfile;
}

const roleLabels: Record<UserProfile["role"], string> = {
  student: "Estudiante",
  instructor: "Instructor",
  moderator: "Moderador Academix",
  admin: "Administrador",
};

function ProfileForm({ profile }: ProfileFormProps) {
  const [form, setForm] = useState<ProfileFormFields>(() => ({
    fullName: profile.fullName,
    phone: profile.phone,
    country: profile.country,
    bio: profile.bio,
  }));
  const [formError, setFormError] = useState("");
  const mutation = useUpdateMyProfile();

  function updateField<Key extends keyof ProfileFormFields>(key: Key, value: ProfileFormFields[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFormError("");
    mutation.reset();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.fullName.trim().length < 2) {
      setFormError("Escribe un nombre válido de al menos 2 caracteres.");
      return;
    }
    if (form.phone.trim().length > 30) {
      setFormError("El teléfono no puede superar los 30 caracteres.");
      return;
    }
    if (form.country.trim().length > 100) {
      setFormError("El país no puede superar los 100 caracteres.");
      return;
    }
    if (form.bio.trim().length > 2000) {
      setFormError("La biografía no puede superar los 2000 caracteres.");
      return;
    }

    mutation.mutate({
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      country: form.country.trim(),
      bio: form.bio.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <section className="rounded-2xl border border-slate-700/70 bg-slate-900 p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            label="Nombre completo"
            autoComplete="name"
            value={form.fullName}
            maxLength={160}
            onChange={(event) => updateField("fullName", event.target.value)}
          />
          <FormField label="Correo electrónico" type="email" value={profile.email} disabled hint="El correo se administra desde tu cuenta." />
          <FormField
            label="Teléfono"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            maxLength={30}
            onChange={(event) => updateField("phone", event.target.value)}
            placeholder="+52 000 000 0000"
          />
          <FormField
            label="País"
            autoComplete="country-name"
            value={form.country}
            maxLength={100}
            onChange={(event) => updateField("country", event.target.value)}
          />
        </div>

        <label className="mt-5 block text-sm font-medium text-slate-200">
          Biografía
          <textarea
            value={form.bio}
            onChange={(event) => updateField("bio", event.target.value)}
            maxLength={2000}
            rows={5}
            placeholder="Cuéntanos brevemente qué quieres aprender."
            className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15"
          />
          <span className="mt-2 block text-right text-xs text-slate-500">{form.bio.length}/2000</span>
        </label>

        {formError || mutation.isError ? (
          <div role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {formError || userErrorMessage(mutation.error, "No pudimos guardar tu perfil. Intenta nuevamente.")}
          </div>
        ) : null}
        {mutation.isSuccess ? (
          <div role="status" className="mt-5 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            Tu perfil se actualizó correctamente.
          </div>
        ) : null}

        <Button type="submit" className="mt-6" disabled={mutation.isPending}>
          {mutation.isPending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </section>

      <aside className="h-fit rounded-2xl border border-slate-700/70 bg-slate-900 p-6 text-center">
        <AvatarPicker avatarId={profile.avatarId} name={profile.fullName} />
        <p className="mt-4 font-bold text-white">{profile.fullName}</p>
        <p className="mt-1 text-sm text-slate-500">{profile.email}</p>
        <Badge className="mt-4">{roleLabels[profile.role]}</Badge>
        <p className="mt-5 border-t border-white/10 pt-5 text-xs leading-5 text-slate-500">
          Tu información personal está vinculada a tu cuenta de Academix.
        </p>
      </aside>
    </form>
  );
}

export default function ProfilePage() {
  const query = useMyProfile();

  if (query.isLoading) return <PageLoader label="Cargando tu perfil" />;
  if (query.isError || !query.data) {
    return (
      <ErrorState
        description={userErrorMessage(query.error, "No pudimos cargar tu perfil.")}
        onRetry={() => void query.refetch()}
      />
    );
  }

  return (
    <div>
      <StudentPageHeader
        eyebrow="Cuenta Academix"
        title="Mi perfil"
        description="Mantén actualizada tu información personal y tus objetivos de aprendizaje."
      />
      <ProfileForm key={query.data.id} profile={query.data} />
      <SubscriptionPanel />
      <AccountDeletionPanel key={query.data.id} />
    </div>
  );
}
