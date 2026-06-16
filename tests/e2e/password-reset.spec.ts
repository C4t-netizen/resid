import { test, expect } from "@playwright/test";
import { mockSupabaseAuth } from "./helpers/supabase-mock";

test.describe("Restablecimiento de contraseña (cross-browser)", () => {
  test.beforeEach(async ({ page }) => {
    // Limpia storage entre pruebas para que /auth no redirija por sesión persistida.
    await page.addInitScript(() => {
      try {
        window.localStorage.clear();
        window.sessionStorage.clear();
      } catch {}
    });
  });

  test("solicitar enlace desde /auth muestra confirmación", async ({ page }) => {
    await mockSupabaseAuth(page);
    await page.goto("/auth");

    await page.getByRole("button", { name: /olvidaste tu contraseña/i }).click();

    const emailInput = page.getByLabel(/correo electrónico/i);
    await expect(emailInput).toBeVisible();
    await emailInput.fill("tester@example.com");

    await page.getByRole("button", { name: /enviar enlace de recuperación/i }).click();

    await expect(
      page.getByText(/te enviamos un correo con el enlace/i),
    ).toBeVisible({ timeout: 5000 });
  });

  test("link expirado: muestra error y permite solicitar uno nuevo", async ({ page }) => {
    await mockSupabaseAuth(page, { verifyExpired: true });

    await page.goto("/reset-password?token_hash=expired-token&type=recovery");

    await expect(
      page.getByText(/enlace .* (no es válido|inválido|expirado)/i),
    ).toBeVisible({ timeout: 7000 });

    await page.getByRole("button", { name: /solicitar nuevo enlace/i }).click();

    await expect(page).toHaveURL(/\/auth/);
    await expect(page.getByRole("button", { name: /enviar enlace de recuperación/i })).toBeVisible();
  });

  test("link válido: permite establecer nueva contraseña y redirige a /auth", async ({ page }) => {
    await mockSupabaseAuth(page);

    await page.goto("/reset-password?token_hash=valid-token&type=recovery");

    await expect(page.getByText(/correo verificado/i)).toBeVisible({ timeout: 7000 });

    await page.getByLabel(/^nueva contraseña$/i).fill("NuevoPass123!");
    await page.getByLabel(/confirmar contraseña/i).fill("NuevoPass123!");

    await page.getByRole("button", { name: /^cambiar contraseña$/i }).click();

    await expect(page.getByText(/contraseña actualizada/i)).toBeVisible({ timeout: 7000 });
    await expect(page).toHaveURL(/\/auth/);
  });

  test("contraseñas no coinciden: muestra error de validación", async ({ page }) => {
    await mockSupabaseAuth(page);

    await page.goto("/reset-password?token_hash=valid-token&type=recovery");
    await expect(page.getByText(/correo verificado/i)).toBeVisible({ timeout: 7000 });

    await page.getByLabel(/^nueva contraseña$/i).fill("NuevoPass123!");
    await page.getByLabel(/confirmar contraseña/i).fill("Distinta456!");
    await page.getByRole("button", { name: /^cambiar contraseña$/i }).click();

    await expect(page.getByText(/no coinciden/i)).toBeVisible();
  });

  test("contraseña muy corta: muestra error de validación mínima", async ({ page }) => {
    await mockSupabaseAuth(page);

    await page.goto("/reset-password?token_hash=valid-token&type=recovery");
    await expect(page.getByText(/correo verificado/i)).toBeVisible({ timeout: 7000 });

    await page.getByLabel(/^nueva contraseña$/i).fill("123");
    await page.getByLabel(/confirmar contraseña/i).fill("123");
    await page.getByRole("button", { name: /^cambiar contraseña$/i }).click();

    await expect(page.getByText(/mínimo 6 caracteres/i)).toBeVisible();
  });

  test("?forgot=1 en /auth abre el formulario de recuperación", async ({ page }) => {
    await mockSupabaseAuth(page);
    await page.goto("/auth?forgot=1");

    await expect(
      page.getByRole("button", { name: /enviar enlace de recuperación/i }),
    ).toBeVisible({ timeout: 5000 });
  });
});
