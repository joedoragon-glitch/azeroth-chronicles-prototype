/* Presentation only: arrange already-localized, audited Archive copy verbatim. */
(function (root) {
  'use strict';
  const calculation = (text) => /\bmax\(|\bln\(|\blog1p\(|\/\s*\(1\s*\+/.test(text);
  const numericLabel =
    /^(?:Level|HP|MP|damage|base damage|warning|threshold|tail|recovery|base recovery|Charged recovery|radius|reach|Rank|Slow|Nivel|PV|PM|daño|daño base|advertencia|umbral|cola|recuperación|reutilización básica|Recuperación cargada|radio|alcance|Rango|Ralentización)$/i;
  function fields(text) {
    return text.split(/\s+·\s+|;\s+/).map((piece) => {
      const colon = piece.match(/^([^:]+):\s*(.+)$/s);
      if (colon && colon[1].length < 90) return { label: colon[1], value: colon[2] };
      const value = piece.match(/^([^\d]*?\S)\s+([+−×]?\d[\s\S]*)$/);
      return value && numericLabel.test(value[1])
        ? { label: value[1], value: value[2] }
        : { label: '', value: piece };
    });
  }
  function section(text) {
    const colon = text.match(/^([^:\n]+):\s*([\s\S]+)$/);
    const named = colon && colon[1].length < 90 && !calculation(colon[1]);
    const title = named ? colon[1] : '';
    const body = named ? colon[2] : text;
    return calculation(text) ? { title, formula: body } : { title, rows: fields(body) };
  }
  function figureSections(text) {
    const result = [];
    for (const paragraph of text.split(/\n\n+/))
      for (const line of paragraph.split('\n'))
        for (const sentence of line.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚ¿])/).filter(Boolean))
          result.push(section(sentence));
    return result;
  }
  function bossAnswer(text) {
    const parts = text.split(
      /\n\n(?=Passive — |Pasiva — |Support — |Apoyo — |Attacks: |Ataques: )/,
    );
    if (parts.length < 2) return text;
    return {
      summary: parts[0],
      sections: parts.slice(1).map((part) => {
        const match = part.match(/^(.+?)(?: — |: )([\s\S]+)$/);
        return match ? { title: match[1], rows: fields(match[2]) } : section(part);
      }),
    };
  }
  function creatures(text) {
    const parts = text.split('\n\n'),
      summary = parts.shift(),
      sections = [];
    for (const part of parts) {
      const lines = part.split('\n');
      if (!lines[0].includes(' · ')) sections.push({ title: lines.shift(), rows: [] });
      const name = lines.shift();
      if (name) sections.push({ title: name, rows: lines.flatMap(fields) });
    }
    return { summary, sections };
  }
  function present({ title, text, section: shelf, figures }) {
    if (typeof text !== 'string' || !shelf) return text;
    if (figures) return { summary: '', sections: figureSections(text) };
    if (title === 'Creatures encountered') return creatures(text);
    if (shelf === 'Adversaries and their attacks') return bossAnswer(text);
    return text;
  }
  const api = { present };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeArchiveReading = api;
})(typeof window !== 'undefined' ? window : globalThis);
