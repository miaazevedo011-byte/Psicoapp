// ========== MENU E NAVEGAÇÃO ==========
function toggleMenu() {
    const menu = document.getElementById('sideMenu');
    menu.classList.toggle('aberto');
}

function mostrarAba(nome) {
    document.querySelectorAll('.aba').forEach(a => a.classList.remove('ativa'));
    document.getElementById(`aba-${nome}`).classList.add('ativa');
    toggleMenu();
    window.scrollTo(0, 0);
}

function mostrarSubaba(nome) {
    document.querySelectorAll('.botao-subaba').forEach(b => b.classList.remove('ativo'));
    event.target.classList.add('ativo');
    document.querySelectorAll('.conteudo-subaba').forEach(c => c.classList.remove('ativo'));
    document.getElementById(`subaba-${nome}`).classList.add('ativa');
}

// ========== GERENCIAR ARQUIVOS ==========
let arquivosSalvos = JSON.parse(localStorage.getItem('psicoapp_arquivos') || '[]');

function processarArquivo(event) {
    const arquivo = event.target.files[0];
    if (!arquivo) return;

    const leitor = new FileReader();
    
    leitor.onload = function(e) {
        const dados = {
            id: Date.now(),
            nome: arquivo.name,
            tipo: arquivo.type,
            tamanho: arquivo.size,
            conteudo: e.target.result
        };
        
        arquivosSalvos.push(dados);
        salvarArquivos();
        atualizarListaArquivos();
        exibirArquivo(dados);
    };

    if (arquivo.type === 'application/pdf' || arquivo.name.endsWith('.pdf')) {
        leitor.readAsArrayBuffer(arquivo);
    } else {
        leitor.readAsDataURL(arquivo);
    }
}

function salvarArquivos() {
    localStorage.setItem('psicoapp_arquivos', JSON.stringify(arquivosSalvos));
}

function atualizarListaArquivos() {
    const lista = document.getElementById('listaArquivos');
    
    if (arquivosSalvos.length === 0) {
        lista.innerHTML = '<p class="vazio">Nenhum arquivo salvo ainda. Envie um arquivo para começar!</p>';
        return;
    }

    lista.innerHTML = arquivosSalvos.map(arq => `
        <div class="item-arquivo">
            <span>📄 ${arq.nome}</span>
            <div>
                <button onclick="abrirArquivoPorId(${arq.id})" style="padding:6px 10px;font-size:13px;margin-right:5px">Abrir</button>
                <button onclick="excluirArquivo(${arq.id})" style="background:#e57373;padding:6px 10px;font-size:13px">✕</button>
            </div>
        </div>
    `).join('');
}

function abrirArquivoPorId(id) {
    const arq = arquivosSalvos.find(a => a.id === id);
    if (arq) exibirArquivo(arq);
}

function excluirArquivo(id) {
    arquivosSalvos = arquivosSalvos.filter(a => a.id !== id);
    salvarArquivos();
    atualizarListaArquivos();
    document.getElementById('visualizador').innerHTML = '';
}

async function exibirArquivo(arq) {
    const visualizador = document.getElementById('visualizador');
    visualizador.innerHTML = `<p style="text-align:center">Carregando ${arq.nome}...</p>`;

    if (arq.nome.endsWith('.pdf') || arq.tipo === 'application/pdf') {
        exibirPDF(arq, visualizador);
    } 
    else if (arq.nome.endsWith('.docx')) {
        exibirDOCX(arq, visualizador);
    }
    else if (arq.tipo.startsWith('image/')) {
        visualizador.innerHTML = `<img src="${arq.conteudo}" alt="${arq.nome}" style="max-width:100%">`;
    }
    else {
        visualizador.innerHTML = `<p>Não foi possível exibir este tipo de arquivo. Tente baixá-lo e abrir no programa correspondente.</p>`;
    }
}

async function exibirPDF(arq, visualizador) {
    try {
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        const loadingTask = pdfjsLib.getDocument({ data: arq.conteudo });
        const pdf = await loadingTask.promise;
        const pagina = await pdf.getPage(1);
        const escala = 1.5;
        const viewport = pagina.getViewport({ scale: escala });

        visualizador.innerHTML = '';
        const canvas = document.createElement('canvas');
        const contexto = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        visualizador.appendChild(canvas);

        await pagina.render({ canvasContext: contexto, viewport: viewport }).promise;
        visualizador.innerHTML += `<p style="margin-top:10px;text-align:center;color:#666;font-size:13px;">📄 ${arq.nome} — Página 1 de ${pdf.numPages}</p>`;
    } catch (erro) {
        visualizador.innerHTML = `<p>Erro ao exibir PDF. Tente baixar o arquivo para ler.</p>`;
    }
}

async function exibirDOCX(arq, visualizador) {
    try {
        const resposta = await fetch(arq.conteudo);
        const dadosArquivo = await resposta.blob();
        const arrayBuffer = await dadosArquivo.arrayBuffer();
        
        visualizador.innerHTML = '';
        const conteudoDiv = document.createElement('div');
        visualizador.appendChild(conteudoDiv);
        
        window.docxPreview.renderAsync(arrayBuffer, conteudoDiv)
            .then(() => {
                visualizador.innerHTML = `<h4>📝 ${arq.nome}</h4>` + visualizador.innerHTML;
            })
            .catch(err => {
                visualizador.innerHTML = `<p>Este arquivo .docx não pode ser exibido diretamente. Por favor, abra no Microsoft Word ou Google Docs.</p>`;
            });
    } catch (erro) {
        visualizador.innerHTML = `<p>Arquivo .docx carregado! Clique para baixar e abrir no Word.</p>`;
    }
}

// ========== FLASHCARDS ==========
let cartoesSalvos = JSON.parse(localStorage.getItem('psicoapp_cartoes') || '[]');

function adicionarCartao() {
    const pergunta = document.getElementById('perguntaCartao').value.trim();
    const resposta = document.getElementById('respostaCartao').value.trim();
    
    if (!pergunta || !resposta) {
        alert('Preencha a pergunta e a resposta!');
        return;
    }

    cartoesSalvos.push({ pergunta, resposta, id: Date.now() });
    localStorage.setItem('psicoapp_cartoes', JSON.stringify(cartoesSalvos));
    
    document.getElementById('perguntaCartao').value = '';
    document.getElementById('respostaCartao').value = '';
    atualizarCartoes();
}

function atualizarCartoes() {
    const container = document.getElementById('containerCartoes');
    
    if (cartoesSalvos.length === 0) {
        container.innerHTML = '<p class="vazio">Nenhum cartão criado ainda. Crie acima para estudar!</p>';
        return;
    }

    container.innerHTML = cartoesSalvos.map((c, i) => `
        <div class="cartao" onclick="this.classList.toggle('virado')">
            <div class="frente"><strong>❓</strong> ${c.pergunta}</div>
            <div class="verso"><strong>✅</strong> ${c.resposta}</div>
            <button onclick="event.stopPropagation(); excluirCartao(${c.id})" style="margin-top:10px;background:#e57373;padding:4px 8px;font-size:12px">Excluir</button>
        </div>
    `).join('');
}

function excluirCartao(id) {
    cartoesSalvos = cartoesSalvos.filter(c => c.id !== id);
    localStorage.setItem('psicoapp_cartoes', JSON.stringify(cartoesSalvos));
    atualizarCartoes();
}

// ========== NOTAS / POST-ITS ==========
let notasSalvas = JSON.parse(localStorage.getItem('psicoapp_notas') || '[]');

function adicionarNota() {
    const texto = document.getElementById('textoNota').value.trim();
    const cor = document.getElementById('corNota').value;
    
    if (!texto) {
        alert('Escreva sua anotação!');
        return;
    }

    notasSalvas.push({ texto, cor, id: Date.now() });
    localStorage.setItem('psicoapp_notas', JSON.stringify(notasSalvas));
    
    document.getElementById('textoNota').value = '';
    atualizarNotas();
}

function atualizarNotas() {
    const container = document.getElementById('containerNotas');
    
    if (notasSalvas.length === 0) {
        container.innerHTML = '<p class="vazio">Nenhuma anotação ainda. Clique acima para criar um Post-it!</p>';
        return;
    }

    container.innerHTML = notasSalvas.map(n => `
        <div class="nota" style="background:${n.cor}">
            <button onclick="excluirNota(${n.id})">✕</button>
            <p>${n.texto}</p>
        </div>
    `).join('');
}

function excluirNota(id) {
    notasSalvas = notasSalvas.filter(n => n.id !== id);
    localStorage.setItem('psicoapp_notas', JSON.stringify(notasSalvas));
    atualizarNotas();
}

// ========== BUSCA CIENTÍFICA ==========
function buscar(base) {
    const termo = encodeURIComponent(document.getElementById('termoBusca').value);
    if (!termo) {
        alert('Digite um termo para buscar!');
        return;
    }

    const urls = {
        scielo: `https://search.scielo.org/?q=${termo}&lang=pt`,
        pubmed: `https://pubmed.ncbi.nlm.nih.gov/?term=${termo}`,
        cochrane: `https://www.cochranelibrary.com/cdsr/search?query=${termo}`,
        google: `https://scholar.google.com/scholar?q=${termo}`,
        epistemonikos: `https://www.epistemonikos.org/buscador?q=${termo}`,
        apa: `https://psycnet.apa.org/search?query=${termo}`
    };

    window.open(urls[base], '_blank');
}

// ========== ASSISTENTE IA ==========
function abrirIA() {
    const pergunta = encodeURIComponent(document.getElementById('perguntaIA').value);
    if (!pergunta) {
        alert('Escreva sua pergunta primeiro!');
        return;
    }
    window.open(`https://www.google.com/search?q=${pergunta}`, '_blank');
}

// ========== INICIALIZAR ==========
document.addEventListener('DOMContentLoaded', function() {
    atualizarListaArquivos();
    atualizarCartoes();
    atualizarNotas();
});
