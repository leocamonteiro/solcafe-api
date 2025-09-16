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
app.post('/products', (req, res) => {
  const db = readDB();
  const novoProduto = req.body;
  novoProduto.id = Date.now(); // Gera ID único

  db.products.push(novoProduto);
  writeDB(db);

  res.status(201).json(novoProduto);
});

// DELETE: remove produto por ID
app.delete('/products/:id', (req, res) => {
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