import { CourseType } from './types';

export const APP_NAME = "OE-SESCINC Med+ Group";

export const HOURLY_RATES = {
  THEORY: 60,
  PRACTICE: 75
};

export const EVALUATION_SCHEMAS = {
  [CourseType.CBA_2]: {
    theory: ['P1', 'P2', 'P3', 'Recuperação'],
    practice: ['T1 TP/EPR', 'T2 TP/EPR', 'Erros', 'Nota TP/EPR', 'Emerg. Químicas', 'APH', 'Maneabilidade', 'Exerc. Fogo'],
    timeFields: ['T1 TP/EPR', 'T2 TP/EPR'], // Fields that are strings (mm:ss)
    avgPracticeFields: ['Nota TP/EPR', 'Emerg. Químicas', 'APH', 'Maneabilidade', 'Exerc. Fogo'] // Numeric fields to average
  },
  [CourseType.CBA_2_COMP]: {
    theory: ['P1', 'P2', 'P3', 'Recuperação'],
    practice: ['T1 TP/EPR', 'T2 TP/EPR', 'Erros', 'Nota TP/EPR', 'Emerg. Químicas', 'APH', 'Maneabilidade', 'Exerc. Fogo'],
    timeFields: ['T1 TP/EPR', 'T2 TP/EPR'],
    avgPracticeFields: ['Nota TP/EPR', 'Emerg. Químicas', 'APH', 'Maneabilidade', 'Exerc. Fogo']
  },
  [CourseType.CBA_AT]: {
    theory: ['P1', 'Recuperação'],
    practice: ['T1 TP/EPR', 'T2 TP/EPR', 'Erros', 'Nota TP/EPR', 'Emerg. Químicas', 'APH', 'Maneabilidade', 'Exerc. Fogo'],
    timeFields: ['T1 TP/EPR', 'T2 TP/EPR'],
    avgPracticeFields: ['Nota TP/EPR', 'Emerg. Químicas', 'APH', 'Maneabilidade', 'Exerc. Fogo']
  },
  [CourseType.CBA_CE]: {
    theory: ['P1', 'Recuperação'],
    practice: ['Com. Oral', 'Liderança/Equipe', 'Desemp. Emergência', 'Gestão Emergência', 'Estudo Caso', 'Com. Escrita'],
    timeFields: [],
    avgPracticeFields: ['Com. Oral', 'Liderança/Equipe', 'Desemp. Emergência', 'Gestão Emergência', 'Estudo Caso', 'Com. Escrita']
  },
  [CourseType.CUSTOM]: {
    theory: ['P1'],
    practice: ['Avaliação Prática'],
    timeFields: [],
    avgPracticeFields: ['Avaliação Prática']
  }
};

export const MOCK_USER_ID = "admin-123"; // For initial session