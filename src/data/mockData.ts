export interface Claim {
  id: number;
  text: string;
  status: "validated" | "invalid";
  source: string;
  sourceLevel: string;
  sourceUrl?: string;
}

export interface AnalysisResult {
  videoTitle: string;
  videoChannel: string;
  thumbnailUrl: string;
  embedUrl: string;
  transcript: string;
  claims: Claim[];
  overallScore: number;
}

export const mockAnalysisResult: AnalysisResult = {
  videoTitle:
    "Os Benefícios da Meditação para a Saúde Mental - O que a Ciência Diz?",
  videoChannel: "Saúde & Ciência BR",
  thumbnailUrl: "",
  embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  transcript: `Olá pessoal, sejam bem-vindos ao canal Saúde & Ciência BR. Hoje vamos falar sobre os benefícios da meditação para a saúde mental, e o mais importante: o que a ciência realmente diz sobre isso.

Primeiro, é importante destacar que a meditação mindfulness tem sido amplamente estudada nas últimas décadas. Pesquisas publicadas na revista JAMA Internal Medicine mostraram que programas de meditação podem reduzir significativamente os níveis de ansiedade e depressão.

Um estudo conduzido pela Universidade de Harvard demonstrou que apenas 8 semanas de prática regular de meditação podem alterar a estrutura do cérebro, aumentando a densidade de matéria cinzenta no hipocampo, uma região associada à memória e ao aprendizado.

Além disso, a meditação também tem efeitos comprovados na redução do cortisol, o hormônio do estresse. Uma meta-análise publicada na revista Health Psychology Review confirmou que praticantes regulares apresentam níveis significativamente menores de cortisol.

Por outro lado, é preciso ter cuidado com afirmações exageradas. Alguns influenciadores dizem que a meditação pode curar o câncer, o que não tem respaldo científico. A meditação é uma ferramenta complementar, não um substituto para tratamentos médicos convencionais.

Por fim, vale mencionar que a meditação pode melhorar a qualidade do sono. Segundo um estudo publicado na JAMA Internal Medicine em 2015, adultos com problemas de sono que participaram de programas de mindfulness apresentaram melhoras significativas.

É isso pessoal! Lembrem-se: a meditação é uma prática acessível e com benefícios reais comprovados pela ciência, mas sempre consulte um profissional de saúde para orientações personalizadas.`,
  claims: [
    {
      id: 1,
      text: "Programas de meditação podem reduzir significativamente os níveis de ansiedade e depressão.",
      status: "validated",
      source: "JAMA Internal Medicine (2014) - Meta-análise de 47 estudos",
      sourceLevel: "Nível 1 - Artigo Científico (Revisão Sistemática)",
    },
    {
      id: 2,
      text: "8 semanas de meditação podem alterar a estrutura do cérebro, aumentando a densidade de matéria cinzenta no hipocampo.",
      status: "validated",
      source:
        "Psychiatry Research: Neuroimaging - Harvard/Massachusetts General Hospital (2011)",
      sourceLevel: "Nível 1 - Artigo Científico (Estudo Experimental)",
    },
    {
      id: 3,
      text: "Praticantes regulares de meditação apresentam níveis significativamente menores de cortisol.",
      status: "validated",
      source:
        "Health Psychology Review - Meta-análise sobre estresse e meditação (2017)",
      sourceLevel: "Nível 1 - Artigo Científico (Meta-análise)",
    },
    {
      id: 4,
      text: "A meditação pode curar o câncer.",
      status: "invalid",
      source:
        "Não há evidências científicas que sustentem essa afirmação. O próprio vídeo reconhece isso como exagero.",
      sourceLevel: "Sem evidências científicas",
    },
    {
      id: 5,
      text: "Adultos com problemas de sono que praticam mindfulness apresentam melhoras significativas na qualidade do sono.",
      status: "validated",
      source:
        "JAMA Internal Medicine (2015) - Estudo randomizado controlado com 49 participantes",
      sourceLevel: "Nível 1 - Artigo Científico (Ensaio Clínico Randomizado)",
    },
  ],
  overallScore: 85,
};

export const loadingSteps = [
  { label: "Extraindo informações do vídeo...", duration: 1200 },
  { label: "Transcrevendo áudio com IA...", duration: 2000 },
  { label: "Identificando afirmações-chave...", duration: 1500 },
  { label: "Buscando artigos científicos...", duration: 2500 },
  { label: "Cruzando dados com fontes confiáveis...", duration: 2000 },
  { label: "Gerando relatório de validação...", duration: 1000 },
];
