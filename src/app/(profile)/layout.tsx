import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/helpers";
import { Navbar } from "@/components/shared";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session) redirect("/login");
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}
