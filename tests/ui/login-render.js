import dotenv from "dotenv";
import LoginPage from "../../pages/LoginPage";
import DashboardPage from "../../pages/DashboardPage";
import { test, expect } from "@playwright/test";
dotenv.config();

test("Login form displayed correctly", async ({ page }) => {
    const loginPage = new LoginPage(page);
    expect(await loginPage.loginHeader).toBeVisible();
    expect(await loginPage.usernameInput).toBeVisible();
    expect(await loginPage.passwordInput).toBeVisible();
    expect(await loginPage.submitButton).toBeVisible();
});