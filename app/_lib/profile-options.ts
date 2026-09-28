// Mirrors the gender/activity_level enums in db/schema.ts. Kept as plain
// literals (not imported from db/schema) so client components don't pull
// drizzle-orm into the browser bundle.

export type Gender = "female" | "male" | "other";

export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";

export const genderOptions: { id: Gender; name: string }[] = [
  { id: "female", name: "Female" },
  { id: "male", name: "Male" },
  { id: "other", name: "Other" },
];

export const activityLevelOptions: { id: ActivityLevel; name: string }[] = [
  { id: "sedentary", name: "Sedentary" },
  { id: "light", name: "Lightly active" },
  { id: "moderate", name: "Moderately active" },
  { id: "active", name: "Active" },
  { id: "very_active", name: "Very active" },
];
