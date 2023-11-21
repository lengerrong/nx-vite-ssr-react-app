import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import { fileURLToPath } from 'node:url';
import expressStaticGzip from 'express-static-gzip'

export async function createServer(
  hmrPort = 4224,
) {

  const app = express()
  let vite: any;

  if (process.env["NODE_ENV"] !== "production") {
    vite  = await (
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
  } else {
    // serve static files
    app.use(expressStaticGzip(path.join(process.cwd(), "dist/apps/activate/browser"), {
      index: false,
      serveStatic: {
        maxAge: '1d'
      }
    }))
  } 
  
  app.use('*', async (req, res) => {
    let template;
    if (process.env["NODE_ENV"] === "production") {
      template = fs.readFileSync(path.resolve(fileURLToPath(import.meta.url), '../../browser/index.html')).toString();
      const { ssrRender } = await import(path.resolve(fileURLToPath(import.meta.url), '../main.server.mjs'));
      ssrRender(template, req, res);
      res.status(200);
    } else {
      const url = req.originalUrl
      // always read fresh template in dev
      template = fs.readFileSync(path.resolve(vite.config.root, './index.html'), 'utf-8')
      template = await vite.transformIndexHtml(url, template)
      const { ssrRender } = await vite.ssrLoadModule('/src/main.server.tsx');
      ssrRender(template, req, res);
    }
  })

  return { app }
}

const port = process.env.PORT || 4200;
createServer().then(({ app }) => {
  const server = app.listen(port, () => {
    // Server has started
    console.log(`app listening on port ${port}`);
  });
  server.on("error", console.error);
});
