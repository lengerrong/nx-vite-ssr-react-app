import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function createServer(
  root = process.cwd(),
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
    root,
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

  // serve the app source root as static resources
  // so that we can easily load styles.css from index.html
  app.get(
    "*.*",
    express.static(path.join(process.cwd(), "apps/activate"), {
      maxAge: "1d",
    })
  );

  app.use('*', async (req, res) => {
    try {
      const url = req.originalUrl

      let template;

      // always read fresh template in dev
      template = fs.readFileSync(resolve('../index.html'), 'utf-8')
      template = await vite.transformIndexHtml(url, template)
      const { render } = (await vite.ssrLoadModule('/apps/activate/src/main.server.tsx'));

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


