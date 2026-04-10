class LoginPage {
  constructor(page) {
    this.page = page;
    this.loginHeader = page.getByRole("heading", { name: "Sign in" });
    this.usernameInput = page.getByTestId("login-email");
    this.passwordInput = page.getByTestId("login-password");
    this.submitButton = page.getByTestId("login-submit");
    this.errorMessage = page.getByTestId("login-error");
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(username, password) {
    await this.goto();
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }
}

export default LoginPage;
