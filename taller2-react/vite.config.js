import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // El proyecto se publica dentro del subdirectorio del repositorio en GitHub Pages.
  base: "/Proyecto-Gesti-n-de-eventos-y-acreditaci-n-QR/",
});
