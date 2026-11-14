function escapeHtml(value: string): string {
  return String(value === null || value === undefined ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inline(texto: string): string {
  return texto
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

export function renderMarkdown(origem: string): string {
  let texto = escapeHtml(origem || '');
  const blocos: string[] = [];

  texto = texto.replace(/```([\s\S]*?)```/g, (_match, codigo: string) => {
    blocos.push('<pre><code>' + codigo.replace(/^\r?\n/, '').replace(/\s+$/, '') + '</code></pre>');
    return '\n\u0000' + (blocos.length - 1) + '\u0000\n';
  });

  let html = '';
  let paragrafo: string[] = [];
  let lista: string[] = [];

  function fecharParagrafo() {
    if (!paragrafo.length) return;
    html += '<p>' + inline(paragrafo.join(' ')) + '</p>';
    paragrafo = [];
  }

  function fecharLista() {
    if (!lista.length) return;
    html += '<ul>' + lista.map((item) => '<li>' + inline(item) + '</li>').join('') + '</ul>';
    lista = [];
  }

  texto.split(/\r?\n/).forEach((linha) => {
    const limpa = linha.trim();
    if (!limpa) {
      fecharParagrafo();
      fecharLista();
      return;
    }
    const bloco = /^\u0000(\d+)\u0000$/.exec(limpa);
    if (bloco) {
      fecharParagrafo();
      fecharLista();
      html += blocos[Number(bloco[1])] || '';
      return;
    }
    const titulo = /^(#{1,3})\s+(.*)$/.exec(limpa);
    if (titulo) {
      fecharParagrafo();
      fecharLista();
      const nivel = titulo[1].length;
      html += '<h' + nivel + '>' + inline(titulo[2]) + '</h' + nivel + '>';
      return;
    }
    const item = /^-\s+(.*)$/.exec(limpa);
    if (item) {
      fecharParagrafo();
      lista.push(item[1]);
      return;
    }
    fecharLista();
    paragrafo.push(limpa);
  });

  fecharParagrafo();
  fecharLista();
  return html || '<p class="muted">Esta página ainda não tem conteúdo.</p>';
}
