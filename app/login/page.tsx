import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-[80vh] flex-col justify-center gap-6 px-5 py-10">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Welcome back</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Log in to keep tracking your meals.
        </p>
      </header>
      <LoginForm />
    </main>
  );
}
