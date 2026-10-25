# 🎨 MLP Visualizer — Frontend (React + Vite + HeroUI + Motion)

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/HeroUI-v2.8-000000?logo=nextui&logoColor=white" alt="HeroUI" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Motion-Framer_Motion-F08?logo=framer&logoColor=white" alt="Motion" />
  <img src="https://img.shields.io/badge/SignalR-Client-512BD4?logo=signalr&logoColor=white" alt="SignalR Client" />
</p>

> **Interface gráfica moderna, fluida e de alta performance para experimentação, treinamento e avaliação visual de Redes Neurais Artificiais em tempo real.**

---

## 📋 Sumário
- [Visão Geral](#-visão-geral)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Estrutura da Aplicação (4 Estúdios)](#-estrutura-da-aplicação-4-estúdios)
  - [1. Datasets & Features](#1-datasets--features)
  - [2. Estúdio de Hiperparâmetros](#2-estúdio-de-hiperparâmetros)
  - [3. Treinamento em Tempo Real (SignalR)](#3-treinamento-em-tempo-real-signalr)
  - [4. Avaliação & Matriz de Confusão](#4-avaliação--matriz-de-confusão)
- [Arquitetura de Componentes e Serviços](#-arquitetura-de-componentes-e-serviços)
- [Comunicação com o Backend](#-comunicação-com-o-backend)
- [Como Executar Localmente](#-como-executar-localmente)
- [Build de Produção e Otimização](#-build-de-produção-e-otimização)
- [Links Relacionados](#-links-relacionados)

---

## 💡 Visão Geral

O frontend do **MLP Visualizer** foi concebido para transformar algoritmos matemáticos complexos de Redes Neurais em uma experiência interativa, acessível e visualmente deslumbrante.

Em vez de dashboards estáticos convencionais, a aplicação opera como um **laboratório interativo de Inteligência Artificial**, conectando-se diretamente ao backend em C# via **WebSockets (SignalR)** para desenhar a curva de aprendizado dinamicamente enquanto o gradiente da rede é ajustado.

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Finalidade |
| :--- | :--- |
| **Vite 6** | Build tool ultrarrápido com Hot Module Replacement (HMR) instantâneo. |
| **React 18 + TypeScript** | Tipagem estrita de contratos, componentes funcionais modernos e hooks reativos. |
| **HeroUI (v2.8)** | Biblioteca moderna de componentes acessíveis com design system refinado. |
| **Tailwind CSS 3.4** | Estilização utilitária com suporte a tema Claro (*Light*) e Escuro (*Dark*). |
| **Motion (`framer-motion`)** | Micro-interações, transições de abas e animações fluidas de entrada e saída. |
| **@microsoft/signalr** | Cliente WebSocket para streaming bidirecional de épocas a 60 FPS com auto-reconnect. |
| **Chart.js & React-Chartjs-2** | Renderização de alta performance em Canvas para plotagem da curva de erro. |
| **PapaParse** | Leitura e parsing veloz de arquivos CSV diretamente no navegador. |
| **Lucide React** | Conjunto completo de ícones modernos e consistentes. |

---

## 🏛️ Estrutura da Aplicação (4 Estúdios)

```mermaid
flowchart LR
    TAB1["1. Datasets & Features"] --> TAB2["2. Hiperparâmetros"]
    TAB2 --> TAB3["3. Treinamento Ao Vivo (WebSocket)"]
    TAB3 --> TAB4["4. Avaliação & Matriz de Confusão"]
```

### 1. Datasets & Features
* **Datasets Benchmark Integrados:** Seleção em 1 clique do clássico **Iris Dataset** (150 registros, 3 espécies) e **ColorBalls Dataset** (400 registros, 4 classes).
* **Upload Customizado de CSV:** Arraste e solte qualquer arquivo CSV para processamento em tempo real.
* **Seletor Interativo de Papéis:** Interface para classificar cada coluna do CSV como Entrada (*Input*), Alvo/Classe (*Target*) ou Ignorada (*Ignore*).
* **Pipeline de Normalização:** Escalonamento Min-Max $[0.0, 1.0]$ automático com prevenção contra reordenação de chaves numéricas do motor JavaScript V8.
* **Divisão Treino/Teste:** Slider dinâmico para particionar os dados (ex: 70% treino / 30% teste).

### 2. Estúdio de Hiperparâmetros
* **Topologia Visual:** Configuração de neurônios de entrada, neurônios ocultos e neurônios de saída com diagrama de camadas animado.
* **Funções de Ativação (*Strategy Pattern*):**
  * **Logística (Sigmoide):** Ideal para probabilidades e saídas entre 0 e 1.
  * **Tangente Hiperbólica (Tanh):** Escala de -1 a 1 com convergência rápida em dados centralizados.
  * **Linear:** Para análise de comportamento sem saturação.
* **Parâmetros de Aprendizado:** Taxa de aprendizado ($\eta$), limite de erro aceitável ($E_{min}$) e limite máximo de épocas.

### 3. Treinamento em Tempo Real (SignalR)
* **WebSocket Bi-direcional:** Conexão mantida com `/hubs/training` com identificador de sessão exclusivo (`sessionId`).
* **Curva de Aprendizado Dinâmica:** Gráfico Canvas desenhado a **60 FPS** com buffer circular e suporte a dezenas de milhares de épocas sem congelar o navegador.
* **Linha de Limiar de Erro:** Visualização clara da meta de erro mínimo ($E_{min}$) no gráfico.
* **Telemetria ao Vivo:** Contador de épocas atual, cronômetro em tempo real, velocidade de redução do erro e barra de progresso.
* **Controles:** Ações imediatas de *Iniciar Treinamento*, *Pausar/Interromper* e *Resetar*.

### 4. Avaliação & Matriz de Confusão
* **Matriz de Confusão em Heatmap:** Mapa de calor interativo onde a intensidade das cores reflete a concentração das previsões (verde na diagonal para acertos, vermelho fora da diagonal para erros).
* **Métricas Detalhadas por Classe:**
  $$\text{Precisão} = \frac{TP}{TP + FP} \qquad \text{Recall} = \frac{TP}{TP + FN} \qquad F_1\text{-Score} = 2 \cdot \frac{\text{Precisão} \cdot \text{Recall}}{\text{Precisão} + \text{Recall}}$$
* **Resumo Global:** Cards com Acurácia Global (%), Total de Épocas executadas, Status de Convergência e Erro Final alcançado.

---

## 📂 Arquitetura de Componentes e Serviços

```text
frontend/src/
├── components/
│   ├── common/                     # Componentes utilitários (ThemeToggle)
│   ├── dataset/                    # Componentes da Aba 1 (DatasetStudio, CsvDropzone, ColumnRoleSelector)
│   ├── evaluation/                 # Componentes da Aba 4 (ConfusionMatrixHeatmap)
│   ├── layout/                     # Navbar, Footer e Hero Banner
│   ├── parameters/                 # Componentes da Aba 2 (TopologyPanel, ActivationPicker, SplitSlider, Hyperparameters)
│   └── training/                   # Componentes da Aba 3 (LearningCurveCanvas, LiveMetricsBar, TrainingControlBar)
│
├── data/presets/                   # Datasets embutidos (Iris, ColorBalls)
├── hooks/                          # Custom Hooks (useTrainingSession, useDataset, useTheme)
├── services/                       # Camada de comunicação externa (api.ts e signalr.ts)
├── types/                          # Interfaces TypeScript estritas (mlp.ts, dataset.ts)
└── utils/                          # Funções puras (normalização, parser CSV, buffers e métricas)
```

---

## 📡 Comunicação com o Backend

A aplicação utiliza um proxy reverso configurado no `vite.config.ts` apontando para o backend ASP.NET Core em `http://localhost:5134`:

* **REST API:** `POST /api/mlp/runPerceptron` e `GET /api/mlp/health`
* **WebSockets (SignalR):** `ws://localhost:5134/hubs/training` (ou via fallback HTTP long-polling transparente).

---

## 🚀 Como Executar Localmente

### 1. Instalar as Dependências
```bash
cd frontend
npm install
```

### 2. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```

Acesse no navegador: **`http://localhost:3000`**

---

## 📦 Build de Produção e Otimização

Para compilar o pacote de produção com verificação estrita de tipagem:

```bash
npm run build
```

O código é otimizado com *code-splitting* em chunks manuais (`vendor-ui` para HeroUI/Motion e `vendor` para demais bibliotecas), gerando arquivos minificados em `dist/`.

Para testar a versão compilada de produção localmente:
```bash
npm run preview
```

---

## 🔗 Links Relacionados
* 📘 [Documentação Geral da Solução (README Principal)](../README.md)
* ⚙️ [Documentação Técnica do Backend C# (.NET Clean Architecture)](../backend/README.md)
* 📄 [Licença do Projeto (MIT)](../LICENSE)
