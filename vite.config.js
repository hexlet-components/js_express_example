// @ts-check

import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    outDir: "dist",
    // Точка входа это css, а не js: своего кода на клиенте у примера нет. Формы
    // отправляет браузер, а клиентский бандл существовал только ради javascript
    // Bootstrap и ушёл вместе с ним.
    //
    // Имя без хеша: страницу рендерит шаблонизатор и просит файл по имени. Хеш заставил
    // бы шаблон читать manifest.json, а кеш ассетов у примера не проблема.
    rollupOptions: {
      input: "src/styles.css",
      output: {
        assetFileNames: "main[extname]",
      },
    },
  },
});
