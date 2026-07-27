import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc', '**/test-output'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            // Backend: Clean-Architecture-Schichten (Abhaengigkeiten zeigen nach innen)
            { sourceTag: 'scope:domain', onlyDependOnLibsWithTags: ['scope:domain', 'scope:shared'] },
            { sourceTag: 'scope:infrastructure', onlyDependOnLibsWithTags: ['scope:infrastructure', 'scope:domain', 'scope:shared'] },
            { sourceTag: 'scope:application', onlyDependOnLibsWithTags: ['scope:application', 'scope:domain', 'scope:shared'] },
            { sourceTag: 'scope:adapters', onlyDependOnLibsWithTags: ['scope:adapters', 'scope:application', 'scope:domain', 'scope:shared'] },
            { sourceTag: 'scope:shared', onlyDependOnLibsWithTags: ['scope:shared', 'scope:domain'] },
            // Frontend
            { sourceTag: 'scope:feature', onlyDependOnLibsWithTags: ['scope:feature', 'scope:domain', 'scope:shared', 'scope:data-access'] },
            { sourceTag: 'scope:data-access', onlyDependOnLibsWithTags: ['scope:data-access', 'scope:domain', 'scope:shared'] },
            // Platform-Trennung (nur shared-contracts ist universal)
            { sourceTag: 'platform:frontend', onlyDependOnLibsWithTags: ['platform:frontend', 'platform:universal'] },
            { sourceTag: 'platform:backend', onlyDependOnLibsWithTags: ['platform:backend', 'platform:universal'] },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];
