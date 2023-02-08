import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function createServer(
  hmrPort = 4224,
) {
  const resolve = (p: string) => path.resolve(__dirname, p)

  const app = express()

  /**
   * @type {import('vite').ViteDevServer}
   */
  const vite = await (
    await import('vite')
  ).createServer({
    root: path.join(process.cwd(), "apps/activate"),
    logLevel: 'info',
    server: {
      middlewareMode: true,
      watch: {
        // During tests we edit the files too fast and sometimes chokidar
        // misses change events, so enforce polling for consistency
        usePolling: true,
        interval: 100,
      },
      hmr: {
        port: hmrPort,
      },
    },
    appType: 'custom',
  })
  // use vite's connect instance as middleware
  app.use(vite.middlewares)

  app.use('*', async (req, res) => {
    try {
      const url = req.originalUrl

      let template;

      // always read fresh template in dev
      template = fs.readFileSync(resolve('../index.html'), 'utf-8')
      template = await vite.transformIndexHtml(url, template)
      const { render } = (await vite.ssrLoadModule('/src/main.server.tsx'));
      // SSR
      const appHtml = render()
      const html = template.replace(`<!--app-html-->`, appHtml)

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e: unknown) {
      vite.ssrFixStacktrace(e as Error)
      console.error(e)
      res.status(500).end(e)
    }
  })

  return { app, vite }
}

const port = process.env.PORT || 4200;
createServer().then(({ app }) => {
  const server = app.listen(port, () => {
    // Server has started
    console.log(`app listening on port ${port}`);
  });
  server.on("error", console.error);
});


