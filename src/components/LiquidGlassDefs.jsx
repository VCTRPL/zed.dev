import orbMap from "../assets/lg/orb-map.png?inline";
import folderMap from "../assets/lg/folder-map.png?inline";

// Liquid Glass refraction (technique from Zettersten's liquid-glass skill).
// One hidden SVG holds the filters; CSS applies them with
// `backdrop-filter: url(#lg-…)`. Only Chromium bends the backdrop through an
// SVG filter, so perf.js adds `html.lg` there and everything else keeps its
// plain blur. The maps (tools/lg-maps.py) bend the rim by Snell's law and
// magnify the centre slightly.
//
// Chromatic aberration: red, green and blue are bent by slightly different
// amounts, as a prism would, then screened back together.
// scale < 0 samples inward, pulling the inside out toward the rim.
const ONLY = {
  r: "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0",
  g: "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0",
  b: "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0",
};

function Filter({ id, w, h, href, scale, spread }) {
  const pass = (ch, k) => [
    <feDisplacementMap
      key={ch + "d"}
      in="SourceGraphic"
      in2="map"
      scale={scale * k}
      xChannelSelector="R"
      yChannelSelector="G"
      result={ch + "d"}
    />,
    <feColorMatrix key={ch + "m"} in={ch + "d"} type="matrix" values={ONLY[ch]} result={ch} />,
  ];
  const image = <feImage result="map" x="0" y="0" width={w} height={h} preserveAspectRatio="none" href={href} />;
  if (!spread) {
    // a single pass: refraction without the colour fringe
    return (
      <filter id={id} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
        {image}
        <feDisplacementMap in="SourceGraphic" in2="map" scale={scale} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    );
  }
  return (
    <filter id={id} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
      {image}
      {pass("r", 1)}
      {pass("g", 1 + spread)}
      {pass("b", 1 + spread * 2)}
      <feBlend in="r" in2="g" mode="screen" result="rg" />
      <feBlend in="rg" in2="b" mode="screen" />
    </filter>
  );
}

export default function LiquidGlassDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute", overflow: "hidden" }}>
      <defs>
        <Filter id="lg-orb" w={92} h={92} href={orbMap} scale={-20} spread={0.035} />
        <Filter id="lg-folder" w={340} h={198} href={folderMap} scale={-22} spread={0} />
      </defs>
    </svg>
  );
}
