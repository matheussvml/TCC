import type { Claim } from "@/lib/scoring";

export type { Claim } from "@/lib/scoring";

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
      veredicto: "VERDADEIRO",
      confianca: 0.92,
      displayScore: 92,
      displayColor: "green",
      source: "Meta-análise de 47 estudos com 3515 participantes confirma redução significativa em sintomas de ansiedade e depressão com programas de mindfulness.",
      sourceLevel: "Verificação multi-fonte",
      fontes: [
        { tipo: "cientifica", titulo: "Meditation Programs for Psychological Stress and Well-being (JAMA, 2014)", url: "https://doi.org/10.1001/jamainternmed.2013.13018" },
        { tipo: "jornalistica", titulo: "Meditação reduz ansiedade e depressão, aponta estudo", url: "https://g1.globo.com/ciencia-e-saude/" },
      ],
    },
    {
      id: 2,
      text: "8 semanas de meditação podem alterar a estrutura do cérebro, aumentando a densidade de matéria cinzenta no hipocampo.",
      status: "validated",
      veredicto: "PARCIALMENTE VERDADEIRO",
      confianca: 0.75,
      displayScore: 50,
      displayColor: "yellow",
      source: "O estudo original observou mudanças em participantes específicos, mas replicações posteriores mostraram resultados mistos. A afirmação é válida com ressalvas.",
      sourceLevel: "Verificação multi-fonte",
      fontes: [
        { tipo: "cientifica", titulo: "Mindfulness practice leads to increases in regional brain gray matter density (Psychiatry Research, 2011)", url: "https://doi.org/10.1016/j.pscychresns.2010.08.006" },
      ],
    },
    {
      id: 3,
      text: "Praticantes regulares de meditação apresentam níveis significativamente menores de cortisol.",
      status: "validated",
      veredicto: "VERDADEIRO",
      confianca: 0.88,
      displayScore: 88,
      displayColor: "green",
      source: "Meta-análise de 2017 com 1012 participantes confirma redução nos níveis de cortisol salivar em praticantes regulares.",
      sourceLevel: "Verificação multi-fonte",
      fontes: [
        { tipo: "cientifica", titulo: "Effect of mindfulness-based stress reduction on cortisol levels (Health Psychology Review, 2017)", url: "https://doi.org/10.1080/17437199.2017.1307651" },
      ],
    },
    {
      id: 4,
      text: "A meditação pode curar o câncer.",
      status: "invalid",
      veredicto: "FALSO",
      confianca: 0.95,
      displayScore: 5,
      displayColor: "red",
      source: "Não há evidências científicas que sustentem essa afirmação. Organizações de saúde como a OMS e o INCA classificam afirmações de cura alternativa do câncer como desinformação perigosa.",
      sourceLevel: "Verificação multi-fonte",
      fontes: [],
    },
    {
      id: 5,
      text: "Adultos com problemas de sono que praticam mindfulness apresentam melhoras significativas na qualidade do sono.",
      status: "validated",
      veredicto: "VERDADEIRO",
      confianca: 0.85,
      displayScore: 85,
      displayColor: "green",
      source: "Ensaio clínico randomizado com 49 adultos idosos com distúrbios de sono moderados confirma benefícios do mindfulness.",
      sourceLevel: "Verificação multi-fonte",
      fontes: [
        { tipo: "cientifica", titulo: "Mindfulness Meditation and Improvement in Sleep Quality (JAMA Internal Medicine, 2015)", url: "https://doi.org/10.1001/jamainternmed.2014.8081" },
      ],
    },
  ],
  overallScore: 64,
};

export const loadingSteps = [
  { label: "Extraindo informações do vídeo...", duration: 1200 },
  { label: "Transcrevendo áudio com IA...", duration: 2000 },
  { label: "Identificando afirmações-chave...", duration: 1500 },
  { label: "Consultando bases de dados científicas e jornalísticas...", duration: 2500 },
  { label: "Validando afirmações com as evidências encontradas...", duration: 2000 },
  { label: "Gerando relatório de validação...", duration: 1000 },
];
