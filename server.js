import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const user = [];

// ROTA DE CADASTRO
app.post('/cadastro', (req, res) => {
    const { usuario, email, senha } = req.body;

    if (!usuario || !email || !senha) {
        return res.status(400).json({ erro: "Preencha todos os campos!" });
    }
    if (senha.length < 6) {
        return res.status(400).json({ erro: "A senha deve ter 6 caracteres ou mais!" });
    }

    const emailExiste = user.find((busca) => busca.email === email);
    if (emailExiste) {
        return res.status(409).json({ erro: "Email já cadastrado!" });
    }

    user.push({ usuario, email, senha });

    return res.json({
        mensagem: "Cadastro feito com sucesso!",
        perfil: `Usuário @${usuario} cadastrado!`
    });
});

// ROTA DE LOGIN
app.post('/login', (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ erro: "Preencha todos os campos!" });
    }

    const usuarioExiste = user.find((busca) => busca.email.toLowerCase() === email.toLowerCase());

    if (!usuarioExiste || usuarioExiste.senha !== senha) {
        return res.status(400).json({ erro: "Usuário ou senha incorretos!" });
    }

    return res.json({
        mensagem: "Login realizado com sucesso!",
        usuario: usuarioExiste.usuario
    });
});

// ROTA DO CHAT
app.post('/chat', async (req, res) => {
    try {
        const API_KEY = process.env.GROQ_API_KEY;

        if (!API_KEY) {
            return res.status(500).json({ erro: "Chave da API da Groq não foi encontrada no arquivo .env!" });
        }

        const URL_API = 'https://api.groq.com/openai/v1/chat/completions';
        
        // Modelo atualizado para o openai/gpt-oss-120b
        const MODELO = 'openai/gpt-oss-120b';

        const historico = req.body.historico || [];

        const persona = [
            {
                role: "system",
                content: `Você é a Mulher-Maravilha (Diana Prince). Responda com um humor inteligente, levemente sarcástico, rápido e confiante. Compare os problemas do dia a dia moderno com desafios de Themyscira ou vilões de Gotham. Seja direta e amigável.Sempre respondaa de forma curta e direta`
            },
            ...historico
        ];

        const respostaBruta = await fetch(URL_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: MODELO,
                messages: persona
            })
        });

        const resultado = await respostaBruta.json();

        if (!respostaBruta.ok) {
            console.error("Erro vindo da Groq:", resultado);
            return res.status(500).json({ erro: "Erro na resposta da Groq." });
        }

        return res.json({ resposta: resultado.choices[0].message.content });

    } catch (erro) {
        console.error("Erro interno no servidor:", erro);
        return res.status(500).json({ erro: "Falha na conexão interna." });
    }
});

app.listen(PORT, () => {

    console.log(`Servidor rodando em : http://localhost:${PORT}/index.html\n`);
});