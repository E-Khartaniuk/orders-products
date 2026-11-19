import { createTranslator } from "use-intl";
import { describe, expect, it } from "vitest";
import ru from "@/i18n/messages/ru.json";
import { IMAGE_MAX_BYTES, checkImageFile } from "./image-files";
import { createPasswordFormSchema, createProfileFormSchema } from "./profile-schemas";

const t = createTranslator({ locale: "ru", messages: ru, namespace: "validation" });

describe("profile form", () => {
  it("trims the name and requires at least two characters", () => {
    const schema = createProfileFormSchema(t);
    expect(schema.parse({ name: "  Анна " }).name).toBe("Анна");
    expect(schema.safeParse({ name: "А" }).success).toBe(false);
  });
});

describe("password form", () => {
  const schema = createPasswordFormSchema(t);

  it("accepts a strong matching password", () => {
    const result = schema.safeParse({
      currentPassword: "old",
      newPassword: "newPass123",
      confirmPassword: "newPass123",
    });
    expect(result.success).toBe(true);
  });

  it("reports mismatched confirmation on its field", () => {
    const result = schema.safeParse({
      currentPassword: "old",
      newPassword: "newPass123",
      confirmPassword: "newPass124",
    });
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual(["confirmPassword"]);
  });
});

describe("checkImageFile", () => {
  it.each([
    [{ type: "image/png", size: 1000 }, null],
    [{ type: "image/gif", size: 1000 }, "type"],
    [{ type: "image/jpeg", size: IMAGE_MAX_BYTES + 1 }, "size"],
  ])("%o → %s", (file, expected) => {
    expect(checkImageFile(file)).toBe(expected);
  });
});
