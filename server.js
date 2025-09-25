const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'coffeeshop-db.json');

app.use(cors());
app.use(express.json());

// Função para ler o banco de dados
function readDB() {
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data);
}

// Função para salvar no banco de dados
function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// GET: lista todos os produtos
app.get('/products', (req, res) => {
  const db = readDB();
  res.json(db.products || []);
});

// GET: produto por ID
app.get('/products/:id', (req, res) => {
  const db = readDB();
  const produto = db.products.find(p => p.id === parseInt(req.params.id));
  if (produto) {
    res.json(produto);
  } else {
    res.status(404).json({ error: 'Produto não encontrado' });
  }
});

// POST: adiciona novo produto
app.post('/products', autenticarToken, (req, res) => {
  const db = readDB();
  const novoProduto = req.body;
  novoProduto.id = Date.now(); // Gera ID único

  db.products.push(novoProduto);
  writeDB(db);

  res.status(201).json(novoProduto);
});

// PUT: atualiza produto por ID
app.put('/products/:id', autenticarToken, (req, res) => {
  const db = readDB();
  const id = parseInt(req.params.id);
  const index = db.products.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Produto não encontrado' });
  }

  const produtoAtualizado = { ...db.products[index], ...req.body, id };
  db.products[index] = produtoAtualizado;
  writeDB(db);

  res.json(produtoAtualizado);
});

// DELETE: remove produto por ID
app.delete('/products/:id', autenticarToken, (req, res) => {

  const db = readDB();
  const id = parseInt(req.params.id);
  const produtosAtualizados = db.products.filter(p => p.id !== id);

  if (produtosAtualizados.length === db.products.length) {
    return res.status(404).json({ error: 'Produto não encontrado' });
  }

  db.products = produtosAtualizados;
  writeDB(db);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`☕ CoffeeShop API rodando em http://localhost:${PORT}`);
});


// Pinga a cada 30s para manter a API funcionando no Render
const axios = require('axios');
const url = 'https://solcafe-api.onrender.com/'; // substitua pela URL da sua API
const interval = 30000; // 30 segundos

function manterAtivo() {
  axios.get(url)
    .then(res => console.log(`Ping às ${new Date().toISOString()}: ${res.status}`))
    .catch(err => console.error(`Erro no ping: ${err.message}`));
}

setInterval(manterAtivo, interval);


// Implementação da Autenticação com JWT

const jwt = require('jsonwebtoken');
const SECRET_KEY = 'sua-chave-secreta'; // idealmente, use variável de ambiente

// Rota de login (simples, sem banco de dados)
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.email === email && u.password === password);

  if (user) {
    const token = jwt.sign({ email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    return res.json({ token });
  }

  res.status(401).json({ error: 'Credenciais inválidas' });
});


// Middleware para proteger rotas
function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado' });
    req.user = user;
    next();
  });
}

// Implementação do endpoint para controle de usuários

// GET: lista todos os usuários
app.get('/users', autenticarToken, (req, res) => {
  const db = readDB();
  res.json(db.users || []);
});

// GET: usuário por ID
app.get('/users/:id', autenticarToken, (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === parseInt(req.params.id));
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: 'Usuário não encontrado' });
  }
});

// POST: cria novo usuário
app.post('/users', (req, res) => {
  const db = readDB();
  const { username, email, password, role } = req.body;

  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  const novoUsuario = {
    id: Date.now(),
    username,
    email,
    password,
    role
  };

  db.users.push(novoUsuario);
  writeDB(db);

  res.status(201).json(novoUsuario);
});


// DELETE: remove usuário por ID
app.delete('/users/:id', autenticarToken, (req, res) => {
  const db = readDB();
  const id = parseInt(req.params.id);
  const usuariosAtualizados = db.users.filter(u => u.id !== id);

  if (usuariosAtualizados.length === db.users.length) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  db.users = usuariosAtualizados;
  writeDB(db);
  res.status(204).send();
});