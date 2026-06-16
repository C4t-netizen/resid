# E2E – Restablecimiento y cambio de contraseña

Pruebas end-to-end con **Playwright** que se ejecutan en **Chromium, Firefox y WebKit** para verificar el flujo completo de recuperación / cambio de contraseña.

Las pruebas mockean las llamadas a `/auth/v1/*` de Lovable Cloud (Supabase) con `page.route`, por lo que son deterministas y no requieren correo real ni service-role key.

## Casos cubiertos

| Spec | Qué valida |
|------|-----------|
| Solicitar enlace desde `/auth` | El formulario "¿Olvidaste tu contraseña?" envía a `auth/v1/recover` y muestra el toast de éxito. |
| Link expirado | `/reset-password?token_hash=...&type=recovery` con `verify` 403 muestra el mensaje de error y el botón "Solicitar nuevo enlace" redirige a `/auth` con el formulario abierto. |
| Link válido → cambiar contraseña | `verifyOtp` OK, `updateUser` OK, se muestra el toast y se redirige a `/auth`. |
| Validación – contraseñas no coinciden | UI bloquea el envío. |
| Validación – contraseña corta (<6) | UI bloquea el envío. |
| `/auth?forgot=1` | Abre directamente el formulario de recuperación (entrada desde el botón de la pantalla de error). |

## Cómo ejecutar

```bash
# 1) (Solo la primera vez) instalar los navegadores
bun run test:e2e:install

# 2) Correr en los tres navegadores
bun run test:e2e

# 3) Modo UI interactivo
bun run test:e2e:ui

# 4) Un solo navegador
bunx playwright test --project=firefox
```

Playwright levanta el dev server (`bun run dev`) automáticamente.
Si ya tienes el preview corriendo en otra URL, exporta `E2E_BASE_URL=https://...` y desactivará el webServer interno.
