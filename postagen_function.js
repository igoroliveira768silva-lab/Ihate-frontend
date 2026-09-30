import { Recomendacao } from "./script.js";

export async function Postar(postagem) {
    try{
        let response = await fetch("http://localhost:3001",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify(postagem)
        });
        //faz as frescura lá.
        if(!response.ok){
            throw new Error("erro em buscar os dados no servidor");
        };
        let data = await response.json();
        return data;
    }
    catch(erro){
        console.log(erro);
    };
};
//FUNÇÃO MODULAR SUPER AVANÇADA QUE BUSCA TODOS OS DADOS, DIZEM QUE ATÉ A NASA TEM MEDO DESSA FUÇÃO.
export async function Get_feed(){
    try{
        let response = await fetch("http://localhost:3001");
        if(!response.ok){
            throw new Error("erroooooo mauu");
        };
        let data = await response.json();
        return data;
    }catch(erro){
         console.log(erro);
    }
};
export function aprender_gosto(gosto_atual, mensagem) {
    const artigos = ['o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'do', 'da', 'em', 'que', 'e', 'com', 'por', 'esse', 'essa', 'no', 'na'];

    // Separa em palavras, coloca em minúsculo e limpa pontuações
    const palavrasEncontradas = mensagem.toLowerCase().match(/\b\w+\b/g);

    if (!palavrasEncontradas) return;

    // Filtra palavras curtas e artigos
    const arrayFiltrado = palavrasEncontradas.filter(palavra => palavra.length > 2 && !artigos.includes(palavra));

    arrayFiltrado.forEach(palavra => {
        // Compara com a propriedade .palavra do objeto!
        let gosto_encontrado = gosto_atual.find(gos => gos.palavra === palavra);

        if (gosto_encontrado) {
            gosto_encontrado.peso++;
        }else{
            // Passa a PALAVRA individual para a classe, e não a mensagem inteira!
            let novo_gosto = new Recomendacao(palavra);
            novo_gosto.peso = 1; // Já começa com peso 1 no primeiro like
            gosto_atual.push(novo_gosto);
        }
    });
}

export function calcularRelevanciaPost(post, gostosUsuario) {
    if (!gostosUsuario || gostosUsuario.length === 0) return 0;

    //Calcula a média dos pesos no perfil do usuário
    let somaPesos = gostosUsuario.reduce((acc, item) => acc + item.peso, 0);
    let media = somaPesos / gostosUsuario.length;

    //Extrai as palavras do post
    let palavrasPost = post.conteudo.toLowerCase().match(/\b\w+\b/g) || [];

    //Soma a pontuação do post com base nas palavras de interesse
    let pontuacaoPost = 0;
    palavrasPost.forEach(palavra => {
        let interesse = gostosUsuario.find(g => g.palavra === palavra);
        if (interesse) {
            pontuacaoPost += interesse.peso;
        }
    });

    // Retorna se o post superou a barra da média
    return pontuacaoPost >= media ? pontuacaoPost : 0;
}

export async function Get_feed_recomendado(gostosUsuario) {
    try {
        let response = await fetch("http://localhost:3001");
        if (!response.ok) throw new Error("Erro ao buscar feed");
        
        let todosPosts = await response.json();

        // Se o usuário ainda não deu like em nada, mostra o feed comum
        if (!gostosUsuario || gostosUsuario.length === 0) {
            return todosPosts;
        }

        // Filtra e ordena apenas os posts relevantes para a "bolha"
        let postsRecomendados = todosPosts
            .map(post => {
                let pontuacao = calcularRelevanciaPost(post, gostosUsuario);
                return { post, pontuacao };
            })
            .filter(item => item.pontuacao > 0) // Pega apenas os que têm relevância
            .sort((a, b) => b.pontuacao - a.pontuacao) // Ordena dos mais bombados pros menos
            .map(item => item.post);

        return postsRecomendados;
    } catch (erro) {
        console.log("Erro no Feed Recomendado:", erro);
        return [];
    }
};