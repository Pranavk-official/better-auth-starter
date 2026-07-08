import { getServerSession } from "@/lib/helpers";
import { EditProfileForm } from "@/components/profile";

export default async function ProfileEditPage() {
  const session = await getServerSession();
  if (!session) return null;

  const { user } = session;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold mb-6">Edit Profile</h1>
      <EditProfileForm
        defaultValues={{ name: user.name, image: user.image ?? "" }}
      />
    </div>
  );
}
