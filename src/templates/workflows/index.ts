import type { WorkflowTemplate } from '../types.js';
import { exploreWorkflow } from './explore.js';
import { newProgramWorkflow } from './new-program.js';
import { statusWorkflow } from './status.js';
import { runWorkflow } from './run.js';
import { evaluateWorkflow } from './evaluate.js';
import { evolveWorkflow } from './evolve.js';
import { analyzeWorkflow } from './analyze.js';
import { continueProgramWorkflow } from './continue-program.js';
import { proposeWorkflow } from './propose.js';

export const workflows: WorkflowTemplate[] = [
  exploreWorkflow,
  newProgramWorkflow,
  continueProgramWorkflow,
  proposeWorkflow,
  statusWorkflow,
  runWorkflow,
  evaluateWorkflow,
  evolveWorkflow,
  analyzeWorkflow,
];

export { exploreWorkflow } from './explore.js';
export { newProgramWorkflow } from './new-program.js';
export { continueProgramWorkflow } from './continue-program.js';
export { proposeWorkflow } from './propose.js';
export { statusWorkflow } from './status.js';
export { runWorkflow } from './run.js';
export { evaluateWorkflow } from './evaluate.js';
export { evolveWorkflow } from './evolve.js';
export { analyzeWorkflow } from './analyze.js';
