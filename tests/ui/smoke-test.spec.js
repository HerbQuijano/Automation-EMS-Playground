import dotenv from "dotenv";
import LoginPage from "../../pages/LoginPage";
import DashboardPage from "../../pages/DashboardPage";
import { test, expect } from "@playwright/test";
dotenv.config();

test.skip("Successful login should display the dashboard", async ({ page }) => {
  const username = process.env.APP_USERNAME;
  const password = process.env.APP_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "Missing login credentials. Set APP_USERNAME/APP_PASSWORD in your environment variables.",
    );
  }

  const loginPage = new LoginPage(page);
  await loginPage.login(username, password);
  await expect(page).toHaveURL(/dashboard/);
  const dashboardPage = new DashboardPage(page);
  console.log(await dashboardPage.getTotalEmployees());
});