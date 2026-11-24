# zed.dev

Site do zed.dev, estúdio de desenvolvimento web de Victor Paula em Belo Horizonte.

Vite + React 19 + Tailwind CSS 4, com three.js carregado sob demanda para a cena 3D.

```bash
npm install
npm run dev      # servidor local
npm run build    # gera a pasta dist/ (é o que a Vercel publica)
```

## Estrutura

- `src/components/LightField.jsx`: a cortina de luz com linhas finas (shader WebGL) do topo, do Processo e do card Sobre
- `src/components/GlassFolder.jsx`: as pastas de vidro dos projetos
- `src/components/HalftoneFooter.jsx`: rodapé com a marca em pontos
- `src/three/zed-scene.js`: a logo em 3D
- `src/data/site.js`: textos, links e projetos
