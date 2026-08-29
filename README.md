# Reputation — reputation.dotrino.com

Calificador de perfiles, sitios y cuentas. Dejas tu calificación de una persona,
un sitio web o una cuenta, y ves lo que opina **tu red de confianza**: lo que
dicen las personas en las que confías pesa, y el ruido de desconocidos no — así
nadie infla su fama con cuentas falsas.

También hay **preguntas y respuestas**, ordenadas por la credibilidad de quien
responde según tu propia red.

Es la cara pública del pilar `@dotrino/reputation`; el registro vive en
`rep.dotrino.com`.

## Sujetos que se pueden calificar

Un perfil del ecosistema, un dominio (`domain:<host>`) o una cuenta de red
(`@handle`). El correo se identifica por su hash, nunca en claro.

## Stack

Vite + Vue 3. Pilares: `@dotrino/reputation`, `@dotrino/identity`,
`@dotrino/profile`, `@dotrino/store`, `@dotrino/topbar`, `@dotrino/nav`,
`@dotrino/install`, `@dotrino/support`.

## Desarrollo

```sh
npm install
npm run dev
npm run build      # → dist/
npm run type-check
```

El backend del pilar está en `dotrino-reputation/server/`.

## Privacidad

Las calificaciones son **atestaciones firmadas** con tu identidad: se publican
porque para eso son, pero el peso lo pone tu red, no un ranking global. Ninguna
página indexa contenido de usuario (§7).

## Licencia

MIT — © Dotrino
