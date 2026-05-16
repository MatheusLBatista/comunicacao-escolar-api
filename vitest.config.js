import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.js'],
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'clover', 'json'],
      exclude: [
        'src/tests/**',
        'src/seeds/**',
        'src/docs/**',
        'src/utils/swagger_utils/**',
        'node_modules/**',
        'utils/helpers/index.js',
        'utils/logger.js',
        'src/services/AuthService.js',
        'src/middlewares/AuthMiddleware.js',
        'src/middlewares/AuthPermission.js',
        'src/utils/TokenUtil.js',
        'src/utils/AuthHelper.js',
        'src/services/PermissionService.js',
        'src/repositories/GrupoRepository.js',
        'src/repositories/filters/GrupoFilterBuilder.js',
        'src/models/Grupo.js',
        'src/models/Rota.js',
        'src/config/MinIO.js',
        'src/config/MulterConfig.js',
        'src/config/SharpConfig.js',
      ],
    },
  },
});
