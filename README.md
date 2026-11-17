# Adrián Pardo · gateway

Puerta de entrada pública para cuando LaLiga hace bloquear las IPs de Cloudflare (días de partido).

Está en GitHub Pages, fuera de Cloudflare. Comprueba a la vez la web principal y la copia de respaldo, y abre la primera que responde. Si no puede comprobar ninguna, enseña los botones y el WhatsApp de Adrián. Sin JavaScript, los botones siguen funcionando.

## Hosts

| | URL | Dónde |
|---|---|---|
| Principal | <https://adrian-pardo.pages.dev/> | Cloudflare Pages (repo `red3dev/adrian-pardo`) |
| Respaldo | <https://blancanieves00.github.io/adrian-pardo-gateway/web/> | GitHub Pages, carpeta `web/` de este repo |

La sonda es `favicon.png` (monograma AP), que existe en los dos.

Enlaces profundos: `…/adrian-pardo-gateway/?ir=cita.html` lleva directo al cuestionario en el host que funcione.

## Cuando se traspase el dominio

Cambia `PRIMARY` y el enlace `#go-primary` en `index.html` a `https://www.adrianpardohairstudio.com/`.

La copia `web/` la actualiza `push.sh` del repo de la web (`mock-web/`) en cada publicación: no se edita a mano.

No usamos Netlify: con un repo de organización privado pide plan de pago.

## GitHub Pages

Activa Pages con **GitHub Actions** en *Settings → Pages*; `.github/workflows/pages.yml` publica la raíz del repo.
