import { execSync } from "node:child_process";

export default function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      "TEST_DATABASE_URL is not set. Point it to an empty MySQL database whose name ends with _test.",
    );
  }

  const database = new URL(url).pathname.slice(1);
  if (!database.endsWith("_test")) {
    throw new Error(
      `Refusing to run integration tests against "${database}": name must end with _test.`,
    );
  }

  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  });
}
