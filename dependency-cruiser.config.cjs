/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "domain-must-not-use-frameworks",
      severity: "error",
      from: { path: "^src/(modules/[^/]+/domain|shared/domain)" },
      to: { path: "^(next|@prisma/client)" },
    },
    {
      name: "domain-must-not-use-infrastructure",
      severity: "error",
      from: { path: "^src/(modules/[^/]+/domain|shared/domain)" },
      to: { path: "^src/(infrastructure|shared/infrastructure|modules/[^/]+/infrastructure)" },
    },
    {
      name: "application-must-not-use-web",
      severity: "error",
      from: { path: "^src/modules/[^/]+/application" },
      to: { path: "^src/app" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    includeOnly: "^src",
    tsConfig: { fileName: "tsconfig.json" },
  },
};
