# agx-remark-rehype

## Usage

This package can be used with AnalogJS by adding it to your `vite.config.ts`:

```ts
import { agxRemarkRehype } from '@joshmorony/agx-remark-rehype'
```

```ts
    plugins: [
      analog({
        vite: {
          experimental: {
            supportAnalogFormat: true,
            markdownTemplateTransforms: [
              agxRemarkRehype({
                remarkPlugins: [[someRemarkPlugin, { withOptions: 0.4 }]],
                rehypePlugins: [someRehypePlugin, someOtherRehypePlugin],
              }),
            ],
          },
        },
      }),
      ...
    ],
```
