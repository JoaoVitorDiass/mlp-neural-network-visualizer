import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
  Tabs,
  Tab,
} from "@heroui/react";
import {
  BookOpen,
  Brain,
  Layers,
  Sliders,
  TrendingDown,
  Grid,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export interface MlpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MlpGuideModal: React.FC<MlpGuideModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
      backdrop="blur"
      classNames={{
        base: "rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-background/95 shadow-2xl backdrop-blur-xl",
        header: "border-b border-slate-100 dark:border-slate-800/60 pb-3",
        footer: "border-t border-slate-100 dark:border-slate-800/60 pt-3",
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">
                    Guia Visual: Como Funciona uma Rede MLP?
                  </h2>
                  <Chip size="sm" variant="flat" color="primary" className="text-[11px] font-medium">
                    Iniciantes & Estudantes
                  </Chip>
                </div>
                <p className="text-xs text-default-500 font-normal">
                  Conceitos essenciais de Perceptron Multicamadas explicados de forma simples e intuitiva.
                </p>
              </div>
            </ModalHeader>

            <ModalBody className="py-5 px-6">
              <Tabs
                aria-label="Tópicos do Guia MLP"
                color="primary"
                variant="solid"
                classNames={{
                  tabList: "bg-slate-100/80 dark:bg-slate-900/60 p-1.5 rounded-2xl w-full gap-1",
                  cursor: "bg-white dark:bg-slate-800 shadow-sm rounded-xl",
                  tab: "text-xs font-semibold h-9",
                }}
              >
                {/* 1. O que é MLP */}
                <Tab
                  key="intro"
                  title={
                    <div className="flex items-center gap-1.5">
                      <Brain className="h-4 w-4" />
                      <span>1. O que é MLP?</span>
                    </div>
                  }
                >
                  <div className="space-y-4 pt-3">
                    <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 space-y-2">
                      <h4 className="text-sm font-bold text-sky-900 dark:text-sky-300 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-sky-500" />
                        Uma analogia com o aprendizado humano
                      </h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        Uma <strong>Rede Neural Perceptron Multicamadas (MLP)</strong> é como um estudante se preparando para uma prova.
                        Ela recebe dados de exemplos (questões resolvidas), tenta adivinhar a resposta certa, mede o quanto errou e,
                        com a ajuda da matemática (a <em>retropropagação</em>), ajusta seus pesos internos para errar menos na próxima tentativa.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                          1. Dados (Entrada)
                        </span>
                        <p className="text-xs text-default-600 leading-snug">
                          Números que descrevem a amostra (ex: comprimento da pétala, largura da sépala).
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
                        <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                          2. Pesos & Bias
                        </span>
                        <p className="text-xs text-default-600 leading-snug">
                          A "memória" da rede. Multiplicadores que dão mais ou menos importância a cada atributo.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                          3. Resposta (Saída)
                        </span>
                        <p className="text-xs text-default-600 leading-snug">
                          A categoria final identificada pela rede (ex: flor Setosa, Versicolor ou Virginica).
                        </p>
                      </div>
                    </div>
                  </div>
                </Tab>

                {/* 2. As Camadas */}
                <Tab
                  key="layers"
                  title={
                    <div className="flex items-center gap-1.5">
                      <Layers className="h-4 w-4" />
                      <span>2. As Camadas</span>
                    </div>
                  }
                >
                  <div className="space-y-4 pt-3">
                    <p className="text-xs text-default-600 leading-relaxed">
                      O fluxo de informações sempre viaja da esquerda para a direita (<strong>propagação direta / feedforward</strong>):
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/50">
                        <div className="p-2 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-bold text-xs shrink-0">
                          Entrada
                        </div>
                        <div className="space-y-0.5 text-xs">
                          <p className="font-bold text-foreground">Camada de Entrada (Input Layer)</p>
                          <p className="text-default-600">
                            Possui 1 neurônio para cada atributo numérico selecionado no dataset. Ela não faz contas complexas, apenas recebe os valores normalizados entre 0 e 1.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200/50">
                        <div className="p-2 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 font-bold text-xs shrink-0">
                          Oculta
                        </div>
                        <div className="space-y-0.5 text-xs">
                          <p className="font-bold text-foreground">Camada Oculta (Hidden Layer)</p>
                          <p className="text-default-600">
                            É o coração do raciocínio não-linear. Cada neurônio oculto combina todas as entradas, soma o bias e passa pela <em>função de ativação</em> para identificar fronteiras e padrões que humanos não enxergam a olho nu.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/50">
                        <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 font-bold text-xs shrink-0">
                          Saída
                        </div>
                        <div className="space-y-0.5 text-xs">
                          <p className="font-bold text-foreground">Camada de Saída (Output Layer)</p>
                          <p className="text-default-600">
                            Possui 1 neurônio para cada classe possível (codificação One-Hot). O neurônio que produzir o maior valor numérico indica a classe prevista pela rede!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Tab>

                {/* 3. Hiperparâmetros */}
                <Tab
                  key="hyperparameters"
                  title={
                    <div className="flex items-center gap-1.5">
                      <Sliders className="h-4 w-4" />
                      <span>3. Hiperparâmetros</span>
                    </div>
                  }
                >
                  <div className="space-y-3 pt-3">
                    <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                          Taxa de Aprendizado (Learning Rate - &eta;)
                        </span>
                        <Chip size="sm" variant="flat" color="warning" className="text-[10px]">
                          Padrão: 0.1 a 0.3
                        </Chip>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        Controla o tamanho do passo que a rede dá para corrigir seus pesos. Se for muito alta, a rede pode oscilar e nunca convergir. Se for muito baixa, o treino fica excessivamente lento.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-900 dark:text-rose-300">
                          Erro Mínimo Desejado (E_min)
                        </span>
                        <Chip size="sm" variant="flat" color="danger" className="text-[10px]">
                          Padrão: 0.01 a 0.03
                        </Chip>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        O critério de parada por convergência. Quando o erro médio quadrático em uma época cai abaixo deste valor, o treinamento finaliza com sucesso antes de gastar todas as épocas!
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                          Máximo de Épocas (Epochs)
                        </span>
                        <Chip size="sm" variant="flat" color="secondary" className="text-[10px]">
                          Padrão: 500 a 2000
                        </Chip>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        O limite de revisões de todo o conjunto de dados. Uma época completa significa que a rede viu e treinou com cada uma das amostras exatamente uma vez.
                      </p>
                    </div>
                  </div>
                </Tab>

                {/* 4. Treinamento & Curva */}
                <Tab
                  key="training"
                  title={
                    <div className="flex items-center gap-1.5">
                      <TrendingDown className="h-4 w-4" />
                      <span>4. Treino ao Vivo</span>
                    </div>
                  }
                >
                  <div className="space-y-4 pt-3">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 space-y-2">
                      <h4 className="text-sm font-bold text-foreground">Como interpretar o gráfico ao vivo?</h4>
                      <p className="text-xs text-default-600 leading-relaxed">
                        Durante o treinamento, você verá uma curva caindo suavemente da esquerda para a direita.
                        O eixo vertical representa a <strong>perda média (Loss/Erro)</strong> e o eixo horizontal representa as <strong>épocas</strong>.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          Curva descendo suavemente: O modelo está aprendendo com sucesso!
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                      <p className="font-bold">Dica para Estudantes:</p>
                      <p>
                        A linha pontilhada amarela representa a meta <em>E_min</em>. Assim que a curva azul cruzar essa linha para baixo, o modelo atinge convergência e finaliza imediatamente!
                      </p>
                    </div>
                  </div>
                </Tab>

                {/* 5. Matriz de Confusão */}
                <Tab
                  key="evaluation"
                  title={
                    <div className="flex items-center gap-1.5">
                      <Grid className="h-4 w-4" />
                      <span>5. Matriz de Confusão</span>
                    </div>
                  }
                >
                  <div className="space-y-4 pt-3">
                    <p className="text-xs text-default-600 leading-relaxed">
                      A <strong>Matriz de Confusão</strong> é uma tabela onde comparamos o que a amostra realmente era (linhas) contra o que a rede neural adivinhou (colunas):
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/60 space-y-1">
                        <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                          Diagonal Principal (Verde Pastel)
                        </span>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                          Representa os <strong>Acertos (Verdadeiros Positivos)</strong>. Quanto maiores forem os números na diagonal, mais precisa e afiada é a rede.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/60 space-y-1">
                        <span className="text-xs font-bold text-rose-900 dark:text-rose-300">
                          Células Fora da Diagonal (Salmão/Vermelho)
                        </span>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                          Representam os <strong>Erros e Confusões</strong>. Indicam com qual outra classe a rede se confundiu na hora de fazer a previsão.
                        </p>
                      </div>
                    </div>
                  </div>
                </Tab>
              </Tabs>
            </ModalBody>

            <ModalFooter>
              <Button
                color="primary"
                variant="flat"
                size="sm"
                onClick={onClose}
                className="font-medium rounded-xl"
              >
                Entendi, voltar ao estúdio
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
