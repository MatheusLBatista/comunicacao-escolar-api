const groupPolicies = [
  {
    pattern: /^\/grupos(?:\/|$)/,
    methods: {
      '*': {
        scope: 'global',
        roles: ['admin'],
      },
    },
  },
];

const routePolicies = [
  {
    pattern: /^\/rotas(?:\/|$)/,
    methods: {
      '*': {
        scope: 'global',
        roles: ['admin'],
      },
    },
  },
];

const userPolicies = [
  {
    pattern: /^\/schools\/([^/]+)\/class(?:\/|$)/,
    methods: {
      POST: {
        scope: 'school',
        roles: ['admin'],
        schoolParam: 'schoolId',
      },
    },
  },
  {
    pattern: /^\/schools\/([^/]+)\/members(?:\/|$)/,
    methods: {
      POST: {
        scope: 'school',
        roles: ['admin'],
        schoolParam: 'schoolId',
      },
    },
  },
  {
    pattern: /^\/schools\/([^/]+)\/members\/([^/]+)\/students(?:\/|$)/,
    methods: {
      POST: {
        scope: 'school',
        roles: ['admin'],
        schoolParam: 'schoolId',
      },
    },
  },
  {
    pattern: /^\/schools\/([^/]+)\/users(?:\/|$)/,
    methods: {
      GET: {
        scope: 'school',
        roles: ['admin', 'teacher'],
        schoolParam: 'schoolId',
      },
      POST: {
        scope: 'school',
        roles: ['admin'],
        schoolParam: 'schoolId',
      },
    },
  },
  {
    pattern: /^\/users\/[^/]+(?:\/|$)/,
    methods: {
      GET: {
        scope: 'global',
        roles: ['admin', 'teacher'],
      },
      PATCH: {
        scope: 'global',
        roles: ['admin'],
        allowSelf: true,
      },
      PUT: {
        scope: 'global',
        roles: ['admin'],
      },
      DELETE: {
        scope: 'global',
        roles: ['admin'],
      },
    },
  },
];

const auditLogPolicies = [
  {
    pattern: /^\/schools\/([^/]+)\/audit-logs(?:\/|$)/,
    methods: {
      GET: {
        scope: 'school',
        roles: ['admin'],
        schoolParam: 'id',
      },
    },
  },
];

const rolePolicies = [
  ...groupPolicies,
  ...routePolicies,
  ...userPolicies,
  ...auditLogPolicies,
];

export { groupPolicies, routePolicies, userPolicies, auditLogPolicies };

export default rolePolicies;
