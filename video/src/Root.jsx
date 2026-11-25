import { Composition, continueRender, delayRender } from "remotion";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource/instrument-sans/400.css";
import "@fontsource/instrument-sans/500.css";
import "@fontsource/dm-mono/400.css";
import "@fontsource/dm-mono/500.css";
import Promo, { DURATION } from "./Promo";

// make sure every face is loaded before a frame is captured
const wait = delayRender("fonts");
Promise.all(
  [
    '400 40px "Instrument Serif"',
    'italic 400 40px "Instrument Serif"',
    '400 40px "Instrument Sans"',
    '500 40px "Instrument Sans"',
    '400 40px "DM Mono"',
    '500 40px "DM Mono"',
  ].map((f) => document.fonts.load(f, "Olá ção")),
).then(() => continueRender(wait));

export const Root = () => (
  <>
    <Composition id="Promo" component={Promo} durationInFrames={DURATION} fps={30} width={1080} height={1920} defaultProps={{ music: true }} />
  </>
);
