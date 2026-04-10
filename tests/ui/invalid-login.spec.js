import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import LoginPage from "../../pages/LoginPage.js";
dotenv.config();

test("Invalid login should display error message", async ({ page }) => {
  const username = "invalid@login.com";
  const password = "invalidpassword";

  const loginPage = new LoginPage(page);
  await loginPage.login(username, password);
  expect(await loginPage.getErrorMessage()).toBe("Invalid credentials");
});

test("Empty email should display error message", async ({ page }) => {
  const password = "invalidpassword";
  const loginPage = new LoginPage(page);
  await loginPage.login("", password);
  expect(await loginPage.getErrorMessage()).toBe("email and password required");
});

test("Empty password should display error message", async ({ page }) => {
  const username = "invalid@login.com";
  const loginPage = new LoginPage(page);
  await loginPage.login(username, "");
  expect(await loginPage.getErrorMessage()).toBe("email and password required");
});