import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-[80vh] flex-col justify-center gap-6 px-5 py-10">
      <header>
        <h1 className="font-display text-3xl font-bold text-forest-900">Welcome back</h1>
        <p className="mt-1 text-sm text-sand-500">Log in to keep tracking your meals.</p>
      </header>
      <LoginForm />
    </main>
  );
}
