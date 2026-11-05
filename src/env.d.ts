// Lo que la app usa de <dotrino-topbar> y su .d.ts (0.16) todavía no declara.
import '@dotrino/topbar'

declare module '@dotrino/topbar' {
  interface DotrinoTopbar {
    /** Lleva a la pantalla de tu perfil (profile.dotrino.com). */
    openMyProfile (): void
  }
}
