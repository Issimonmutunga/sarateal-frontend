import katex from "katex";
import "katex/dist/katex.min.css";

export function Formula({ tex }: { tex: string }) {
  const html = katex.renderToString(tex, { throwOnError: false });

  return <span className="about-formula" dangerouslySetInnerHTML={{ __html: html }} />;
}