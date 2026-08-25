const storageKey = "imersao-meta-ads-ia:caderno-mercado:v1";
const sections = [
  ["mercado", "1. Mercado Local"],
  ["concorrentes", "2. Concorrentes"],
  ["reviews", "3. Reviews"],
  ["publico", "4. Público Ideal"],
  ["oportunidades", "5. Oportunidades"],
  ["dossie", "6. Dossiê Final"],
];

const fields = sections.map(([id]) => document.getElementById(id));
const status = document.getElementById("caderno-status");
const fallback = document.getElementById("contexto-alternativo");
const generatedContext = document.getElementById("contexto-gerado");
let saveTimer;

function setStatus(message) {
  status.textContent = message;
}

function readNotebook() {
  return Object.fromEntries(fields.map((field) => [field.id, field.value.trim()]));
}

function saveNotebook() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(readNotebook()));
      setStatus("Salvo automaticamente neste navegador.");
    } catch {
      setStatus("Atenção: o navegador bloqueou o salvamento. Baixe seu caderno agora para não perder o conteúdo.");
    }
  }, 400);
}

function restoreNotebook() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    for (const field of fields) field.value = saved[field.id] || "";
  } catch {
    localStorage.removeItem(storageKey);
    setStatus("Não foi possível recuperar o conteúdo anterior.");
  }
}

function buildContext(lastId = "dossie") {
  const notebook = readNotebook();
  const blocks = ["# CONTEXTO ACUMULADO DO CADERNO DE MERCADO"];
  for (const [id, title] of sections) {
    if (notebook[id]) blocks.push(`## ${title}\n\n${notebook[id]}`);
    if (id === lastId) break;
  }
  return blocks.join("\n\n");
}

async function copyContext(lastId) {
  const content = buildContext(lastId);
  if (!content.includes("## ")) {
    setStatus("Cole pelo menos um resultado antes de copiar.");
    return;
  }
  try {
    await navigator.clipboard.writeText(content);
    fallback.hidden = true;
    setStatus("Contexto copiado. Cole no próximo chat antes de executar a habilidade seguinte.");
  } catch {
    generatedContext.value = content;
    fallback.hidden = false;
    generatedContext.focus();
    generatedContext.select();
    setStatus("O navegador bloqueou a cópia automática. O contexto foi selecionado abaixo para você copiar manualmente.");
  }
}

function downloadNotebook() {
  const content = buildContext();
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "meu-caderno-de-mercado.md";
  link.click();
  URL.revokeObjectURL(url);
  setStatus("Caderno baixado.");
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]);
}

function saveAsPdf() {
  const content = escapeHtml(buildContext());
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    setStatus("O navegador bloqueou a janela do PDF. Libere os pop-ups e tente novamente.");
    return;
  }
  printWindow.opener = null;
  printWindow.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Caderno de Mercado</title><style>body{font-family:Arial,sans-serif;max-width:820px;margin:40px auto;padding:0 24px;color:#111}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:14px/1.55 Arial,sans-serif}@page{margin:18mm}</style></head><body><pre>${content}</pre><script>window.addEventListener('load',()=>window.print())<\/script></body></html>`);
  printWindow.document.close();
  setStatus("A versão para PDF foi aberta. Escolha Salvar como PDF na janela de impressão.");
}

function clearNotebook() {
  if (!confirm("Tem certeza que deseja apagar todo o Caderno de Mercado deste navegador?")) return;
  for (const field of fields) field.value = "";
  localStorage.removeItem(storageKey);
  setStatus("Caderno apagado deste navegador.");
  fields[0].focus();
}

function importNotebook(file) {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const content = String(reader.result || "");
    const hasNotebookHeading = sections.some(([, title]) => content.includes(`## ${title}`));
    if (!hasNotebookHeading) {
      setStatus("Este arquivo não parece ser um Caderno de Mercado válido. Nenhum conteúdo foi alterado.");
      return;
    }
    for (const field of fields) field.value = "";
    for (let index = 0; index < sections.length; index += 1) {
      const [id, title] = sections[index];
      const nextTitle = sections[index + 1]?.[1];
      const start = content.indexOf(`## ${title}`);
      if (start < 0) continue;
      const valueStart = start + `## ${title}`.length;
      const end = nextTitle ? content.indexOf(`## ${nextTitle}`, valueStart) : content.length;
      document.getElementById(id).value = content.slice(valueStart, end < 0 ? content.length : end).trim();
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(readNotebook()));
      setStatus("Caderno restaurado e salvo neste navegador.");
    } catch {
      setStatus("Caderno restaurado na tela, mas o navegador bloqueou o salvamento. Baixe uma nova cópia antes de sair.");
    }
  });
  reader.readAsText(file);
}

restoreNotebook();
for (const field of fields) field.addEventListener("input", saveNotebook);
for (const button of document.querySelectorAll(".copy-through")) {
  button.addEventListener("click", () => copyContext(button.dataset.through));
}
document.getElementById("copiar-contexto").addEventListener("click", () => copyContext("dossie"));
document.getElementById("baixar-caderno").addEventListener("click", downloadNotebook);
document.getElementById("salvar-pdf").addEventListener("click", saveAsPdf);
document.getElementById("limpar-caderno").addEventListener("click", clearNotebook);
document.getElementById("importar-caderno").addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (file) importNotebook(file);
});
