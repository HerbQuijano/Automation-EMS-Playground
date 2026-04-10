class DashboardPage {
  constructor(page) {
    this.page = page;
    this.dashboardHeader = page.getByRole("heading", { name: "Dashboard" });
    this.totalEmployees = page.getByText("Total employees");
    this.activeEmployees = page.getByText("Active", { exact: true });
    this.inactiveEmployees = page.getByText("Inactive", { exact: true });
    this.cards = page.locator(".card");
    this.employeeNumber = this.cards.locator(".kpiValue").first();
    this.activeEmployeesNumber = this.cards.locator(".kpiValue").nth(1);
    this.inactiveEmployeesNumber = this.cards.locator(".kpiValue").last();
    this.userEmaiId = page.locator(".userEmail");
  }

  async getTotalEmployees() {
    return await this.employeeNumber.textContent();
  }

  async getActiveEmployees() {
    return await this.activeEmployeesNumber.textContent();
  }

  async getInactiveEmployees() {
    return await this.inactiveEmployeesNumber.textContent();
  }

  async getUserEmailId() {
    return this.userEmaiId.textContent();
  }
}

export default DashboardPage;
