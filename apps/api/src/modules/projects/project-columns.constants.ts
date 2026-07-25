import type {
  ProjectColumnColor,
  ProjectColumnKind,
} from '../../database/schema';

interface DefaultProjectColumn {
  name: string;
  color: ProjectColumnColor;
  kind: ProjectColumnKind;
  position: number;
}

export const DEFAULT_PROJECT_COLUMNS: readonly DefaultProjectColumn[] = [
  {
    name: 'Backlog',
    color: 'slate',
    kind: 'backlog',
    position: 1_000,
  },
  {
    name: 'To do',
    color: 'blue',
    kind: 'active',
    position: 2_000,
  },
  {
    name: 'In progress',
    color: 'violet',
    kind: 'active',
    position: 3_000,
  },
  {
    name: 'In review',
    color: 'amber',
    kind: 'active',
    position: 4_000,
  },
  {
    name: 'Done',
    color: 'emerald',
    kind: 'done',
    position: 5_000,
  },
];
