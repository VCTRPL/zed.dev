import orbMap from "../assets/lg/orb-map.png?inline";
import folderMap from "../assets/lg/folder-map.png?inline";

// Liquid Glass refraction (technique from Zettersten's liquid-glass skill).
// One hidden SVG holds the filters; CSS applies them with
// `backdrop-filter: url(#lg-…)`. Only Chromium bends the backdrop through an
// SVG filter, so perf.js adds `html.lg` there and everything else keeps its
// plain blur. The maps bend only the rim, so the centre stays clear.
//
// scale < 0 pulls what lies inside the element out toward the rim.
function Filter({ id, w, h, href, scale }) {
  return (
    <filter id={id} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
      <feImage result="map" x="0" y="0" width={w} height={h} preserveAspectRatio="none" href={href} />
      <feDisplacementMap in="SourceGraphic" in2="map" scale={scale} xChannelSelector="R" yChannelSelector="G" />
    </filter>
  );
}

export default function LiquidGlassDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute", overflow: "hidden" }}>
      <defs>
        <Filter id="lg-orb" w={92} h={92} href={orbMap} scale={-24} />
        <Filter id="lg-folder" w={340} h={198} href={folderMap} scale={-18} />
      </defs>
    </svg>
  );
}
