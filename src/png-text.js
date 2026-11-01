(function (root) {
  "use strict";

  function createPngTextTools(measureText) {
    function measure(text, fontSpec) {
      return measureText(String(text), String(fontSpec));
    }

    function wrap(text, maxWidth, fontSpec) {
      const out = [];
      String(text).split("\n").forEach((para) => {
        if (para === "") {
          out.push("");
          return;
        }
        const words = para.split(/\s+/).filter(Boolean);
        let line = "";
        words.forEach((word) => {
          if (measure(word, fontSpec) > maxWidth) {
            if (line) {
              out.push(line);
              line = "";
            }
            let chunk = "";
            for (const character of word) {
              if (chunk && measure(chunk + character, fontSpec) > maxWidth) {
                out.push(chunk);
                chunk = "";
              }
              chunk += character;
            }
            line = chunk;
            return;
          }
          const candidate = line ? `${line} ${word}` : word;
          if (line && measure(candidate, fontSpec) > maxWidth) {
            out.push(line);
            line = word;
          } else {
            line = candidate;
          }
        });
        out.push(line);
      });
      return out.length ? out : [""];
    }

    return Object.freeze({ measure, wrap });
  }

  root.PackagingPngText = Object.freeze({ createPngTextTools });
})(window);
