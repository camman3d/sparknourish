import { SignupForm } from "./SignupForm";

export default function SignupPage() {
  return (
    <main className="flex min-h-[80vh] flex-col justify-center gap-6 px-5 py-10">
      <header>
        <h1 className="font-display text-3xl font-bold text-forest-900">Create your account</h1>
        <p className="mt-1 text-sm text-sand-500">
          We&apos;ll use your health info to set daily calorie and macro goals.
        </p>
      </header>
      <SignupForm />
    </main>
  );
}
