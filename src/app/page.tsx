import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          better-auth-starter
        </h1>
        <div className="flex flex-col gap-3">
          {session ? (
            <>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Signed in as{" "}
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {session.user.name || session.user.email}
                </span>
              </p>
              <p className="text-xs text-zinc-400">{session.user.email}</p>
            </>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Not signed in.</p>
          )}
        </div>
        <div className="flex flex-col gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <p>
            Sign in via{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs font-mono text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              authClient.signIn.social(&#123; provider: &quot;github&quot; &#125;)
            </code>
          </p>
          <p>
            Read the session server-side via{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs font-mono text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              auth.api.getSession(&#123; headers: await headers() &#125;)
            </code>
          </p>
        </div>
      </main>
    </div>
  );
}
