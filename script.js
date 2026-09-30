// IMPORTA MODULOS
import { Postar, Get_feed, aprender_gosto, calcularRelevanciaPost, Get_feed_recomendado } from "./postagen_function.js";
//QUESTIONA SE O FEED ATUAL É RECOMENDADO.
let modoFeedRecomendado = false;
// PEGA O ARMAZENAMENTO LOCAL.
let dadosSalvos = localStorage.getItem("dadosUser");
let Usuario_dados = dadosSalvos ? JSON.parse(dadosSalvos) : {
    logado: false,
    dados: { nome: '', senha: '', token: '' }
};
//dados que dizem oque o usuario quer ver.
let curtidas = [];
//url importante.
const URL = 'http://localhost:3000';

// ELEMENTOS DOM
let login_bt;
let user_bt;
const mensage_input = document.getElementById("mensage_text");
const postar_bt = document.getElementById("postar");
const cabecario = document.getElementById("cabeçalho");
const home_room = document.getElementById("home-room");
const login_room = document.getElementById("login-room");
const exit_bt = document.getElementById("x");
const create_conta = document.getElementById("create-conta");
const input_name = document.getElementById("name");
const input_senha = document.getElementById("senha");
const feed_div = document.getElementById("feed");
const imagem_input_post = document.getElementById("foto-post");
const hate_zone = document.getElementById("Hate-Zone");
const favoritos = document.getElementById("favorito-bt");

class User {
    constructor(nome, senha) {
        this.nome = nome;
        this.senha = senha;
        this.token = Math.random();
    }
};
export class Recomendacao{
    constructor(palavra){
        this.palavra = palavra;
        this.peso = 0;
    }
};

class Mensagem {
    constructor(nome, conteudo,imagem) {
        this.nome = nome;
        this.imagem = imagem;
        this.conteudo = conteudo;
        this.data_post = new Date().toLocaleTimeString();
    }
};

function troca_room(sala1, sala2) {
    sala1.style.display = "none";
    sala2.style.display = "block";
};

// INTERFACE DE LOGIN
if (!Usuario_dados.logado) {
    login_bt = document.createElement("button");
    login_bt.id = "login-bt";
    login_bt.innerText = "LOGIN";
    cabecario.appendChild(login_bt);
    login_bt.addEventListener("click", () => troca_room(home_room, login_room));
} else {
    user_bt = document.createElement("button");
    user_bt.id = "user_bt";
    user_bt.innerText = Usuario_dados.dados.nome[0] || "U";
    cabecario.appendChild(user_bt);
}

exit_bt.addEventListener("click", () => troca_room(login_room, home_room));
hate_zone.addEventListener("click", () => {
    troca_room(hate_zone, favoritos);
    modoFeedRecomendado = false;
    feed_div.innerHTML = ""; 
    quantidade_posts = -1;  
});

favoritos.addEventListener("click", () => {
    troca_room(favoritos, hate_zone);
    modoFeedRecomendado = true;
    feed_div.innerHTML = ""; 
    quantidade_posts = -1;  
});
create_conta.addEventListener("click", async () => {
    let nome = input_name.value;
    let senha = input_senha.value;
    let Usuario = new User(nome, senha);
    let env_data = await Logar(Usuario);

    if (env_data && env_data.status === 200) {
        Usuario_dados.logado = true;
        Usuario_dados.dados.nome = nome;
        Usuario_dados.dados.senha = senha;
        Usuario_dados.dados.token = Usuario.token;
        localStorage.setItem('dadosUser', JSON.stringify(Usuario_dados));
        
        if (login_bt) login_bt.remove();
        user_bt = document.createElement("button");
        user_bt.id = "user_bt";
        user_bt.innerText = nome[0];
        cabecario.appendChild(user_bt);
        
        troca_room(login_room, home_room);
    } else {
        alert("USUÁRIO INVÁLIDO!!");
        input_name.value = "";
        input_senha.value = "";
    }
});

async function Logar(objct) {
    try {
        let response = await fetch(URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(objct)
        });
        if (!response.ok) throw new Error("Erro em pegar os dados");
        let dados_JSON = await response.json();
        return { status: response.status, dados: dados_JSON };
    } catch (erro) {
        console.log(erro);
        return null;
    }
}

// AUXILIAR PARA CRIAR HTML DO POST
function criarElementoPost(msm) {
    let text_box = document.createElement("div");
    text_box.id = "msm-content";
    let imgHTML = msm.imagem ? `<img src="${msm.imagem}" class="post-img" style="max-width: 100%; border-radius: 8px; margin-top: 8px;">` : '';
    text_box.innerHTML = `
        <h2 id="name-user-msm">${msm.nome || 'Anônimo'}</h2><br>
        ${imgHTML}
        <p id="user-msm">${msm.conteudo}</p>
        <h4 id="time-msm">${msm.data_post}</h4><br>
    `;
    let like_bt = document.createElement("button");
    like_bt.innerText = "like";
    like_bt.id = "like-bt";

    //CLICK NO LIKELATION PARA VIRAR UM ALGORITMO MANIPULADOR TIPO AS IAS hehehe.
    like_bt.addEventListener("click",()=>{
        like_bt.style.backgroundColor ="yellow";
        aprender_gosto(curtidas,msm.conteudo);
        console.log(curtidas)
    });
    text_box.appendChild(like_bt);
    return text_box;
}

// ENVIO DE POSTAGEM
postar_bt.addEventListener("click", async () => {
    let content = mensage_input.value;
    let img;
    if(imagem_input_post.value !== ""){
        img = imagem_input_post.value;
    }else{img = null};
    if (content.trim() !== "") {
        let autor = Usuario_dados.dados.nome || "Hater Anônimo";
        let Novo_post = new Mensagem(autor, content,img);
        await Postar(Novo_post);
        mensage_input.value = "";
        imagem_input_post.value = "";
    }
});

// SISTEMA DE FEED TEMPO REAL LIMPO
let quantidade_posts = 0;

async function inicializarFeed() {
    let feed_inicial = await Get_feed();
    if (feed_inicial && Array.isArray(feed_inicial)) {
        feed_div.innerHTML = "";
        feed_inicial.forEach(msm => {
            if (msm) feed_div.appendChild(criarElementoPost(msm));
        });
        quantidade_posts = feed_inicial.length;
    }
}

// Desenha os posts antigos ao abrir a página
inicializarFeed();

// Checa novos posts a cada 1 segundo
setInterval(async () => {
    let feed_atual;
    
    if (modoFeedRecomendado) {
        // Busca usando o algoritmo da bolha
        feed_atual = await Get_feed_recomendado(curtidas); 
    } else {
        // Busca a ordem cronológica padrão
        feed_atual = await Get_feed(); 
    }

    if (feed_atual && feed_atual.length !== quantidade_posts) {
        feed_div.innerHTML = "";
        feed_atual.forEach(msm => {
            if (msm) feed_div.appendChild(criarElementoPost(msm));
        });
        quantidade_posts = feed_atual.length;
    }
}, 1000);