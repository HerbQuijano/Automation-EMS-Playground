import dotenv from "dotenv";
import { test, expect } from "@playwright/test";
import LoginPage from "../../pages/LoginPage.js";
import DashboardPage from "../../pages/DashboardPage.js";
dotenv.config();

test("Admin user should be able to log in successfully", async ({ page }) => {
  const username = process.env.APP_USERNAME;
  const password = process.env.APP_PASSWORD;
  
  const loginPage = new LoginPage(page);
  await loginPage.login(username, password);
  const dashboardPage = new DashboardPage(page);
  await expect(page).toHaveURL(/dashboard/);
  const userEmailId = await dashboardPage.getUserEmailId();
  expect(userEmailId).toBe(username);
});

test("Manager user should be able to log in successfully", async ({ page }) => {
  const username = process.env.MANAGER_USERNAME;
  const password = process.env.MANAGER_PASSWORD;

  const loginPage = new LoginPage(page);
  await loginPage.login(username, password);
  const dashboardPage = new DashboardPage(page);
  await expect(page).toHaveURL(/dashboard/);
  const userEmailId = await dashboardPage.getUserEmailId();
  expect(userEmailId).toBe(username);
});

test("Viewer user should be able to log in successfully", async ({ page }) => {
  const username = process.env.VIEWER_USERNAME;
  const password = process.env.VIEWER_PASSWORD;

  const loginPage = new LoginPage(page);
  await loginPage.login(username, password);
  const dashboardPage = new DashboardPage(page);
  await expect(page).toHaveURL(/dashboard/);
  const userEmailId = await dashboardPage.getUserEmailId();
  expect(userEmailId).toBe(username);
});