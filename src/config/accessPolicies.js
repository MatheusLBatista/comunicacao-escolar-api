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
      PATCH: {
        scope:'school',
        roles:['admin'],
        schoolParam: 'schoolId'
      },
      DELETE: {
        scope: 'school',
        roles: ['admin'],
        schoolParam: 'schoolId',
      },
    },
  },
  {
    pattern: /^\/schools\/([^/]+)\/posts(?:\/|$)/,
    methods: {
      GET: {
        scope: 'school',
        roles: ['admin', 'teacher'],
        schoolParam: 'schoolId',
      },
      POST: {
        scope: 'school',
        roles: ['admin', 'teacher'],
        schoolParam: 'schoolId',
      },
    },
  },
  {
    pattern: /^\/posts\/[^/]+\/attachments\/[^/]+(?:\/|$)/,
    methods: {
      DELETE: {
        scope: 'global',
        roles: ['admin', 'teacher'],
      },
    },
  },
  {
    pattern: /^\/posts\/[^/]+\/attachments(?:\/)?$/,
    methods: {
      POST: {
        scope: 'global',
        roles: ['admin', 'teacher'],
      },
    },
  },
  {
    pattern: /^\/posts\/[^/]+(?:\/|$)/,
    methods: {
      GET: {
        scope: 'global',
        roles: ['admin', 'teacher'],
      },
      PATCH: {
        scope: 'global',
        roles: ['admin', 'teacher'],
      },
      DELETE: {
        scope: 'global',
        roles: ['admin', 'teacher'],
      },
      POST: {
        scope: 'global',
        roles: ['admin', 'teacher', 'parent', 'student'],
      },
    },
  },
  {
    pattern: /^\/attachments\/[^/]+(?:\/|$)/,
    methods: {
      GET: {
        scope: 'global',
        roles: ['admin', 'teacher'],
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
      PATCH: {
        scope: 'school',
        roles: ['admin'],
        schoolParam: 'schoolId',
      },
      DELETE: {
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
      DELETE: {
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
    pattern: /^\/users(?:\/?$)/,
    methods: {
      POST: {
        scope: 'global',
        roles: ['admin'],
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
  {
    pattern: /^\/schools(?:\/[^/]+)?(?:\/|$)/,
    methods: {
      GET: {
        scope: 'global',
        roles: ['admin', 'teacher'],
      },
      POST: {
        scope: 'global',
        roles: ['admin'],
      },
      PATCH: {
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

const resourcePolicies = [
  {
    pattern: /^\/daily-logs(?:\/|$)/,
    methods: {
      GET: {
        scope: 'global',
        roles: ['admin', 'teacher', 'parent'],
      },
      POST: {
        scope: 'global',
        roles: ['admin', 'teacher'],
      },
      PATCH: {
        scope: 'global',
        roles: ['admin', 'teacher', 'parent'],
      },
      PUT: {
        scope: 'global',
        roles: ['admin', 'teacher'],
      },
      DELETE: {
        scope: 'global',
        roles: ['admin', 'teacher'],
      },
    },
  },
  {
    pattern: /^\/pickup-authorizations(?:\/|$)/,
    methods: {
      GET: {
        scope: 'global',
        roles: ['admin', 'teacher', 'parent'],
      },
      POST: {
        scope: 'global',
        roles: ['admin', 'teacher', 'parent'],
      },
      PATCH: {
        scope: 'global',
        roles: ['admin', 'teacher'],
      },
      DELETE: {
        scope: 'global',
        roles: ['admin', 'teacher'],
      },
    },
  },
  {
    pattern: /^\/pickup-logs(?:\/|$)/,
    methods: {
      GET: {
        scope: 'global',
        roles: ['admin', 'teacher', 'parent'],
      },
      POST: {
        scope: 'global',
        roles: ['admin', 'teacher'],
      },
      PATCH: {
        scope: 'global',
        roles: ['admin', 'teacher'],
      },
      DELETE: {
        scope: 'global',
        roles: ['admin', 'teacher'],
      },
    },
  },
  {
    pattern: /^\/events(?:\/|$)/,
    methods: {
      GET: {
        scope: 'global',
        roles: ['admin', 'teacher', 'parent'],
      },
      POST: {
        scope: 'global',
        roles: ['admin', 'teacher'],
      },
      PATCH: {
        scope: 'global',
        roles: ['admin', 'teacher'],
      },
      DELETE: {
        scope: 'global',
        roles: ['admin', 'teacher'],
      },
    },
  },
  {
    pattern: /^\/schools\/([^/]+)\/conversations(?:\/|$)/,
    methods: {
      GET: {
        scope: 'school',
        roles: ['admin', 'teacher', 'parent'],
        schoolParam: 'schoolId',
      },
      POST: {
        scope: 'school',
        roles: ['admin', 'teacher', 'parent'],
        schoolParam: 'schoolId',
      },
    },
  },
  {
    pattern: /^\/conversations\/[^/]+\/messages(?:\/|$)/,
    methods: {
      GET: {
        scope: 'global',
        roles: ['admin', 'teacher', 'parent'],
      },
      POST: {
        scope: 'global',
        roles: ['admin', 'teacher', 'parent'],
      },
      PATCH: {
        scope: 'global',
        roles: ['admin', 'teacher', 'parent'],
      },
    },
  },
  {
    pattern: /^\/conversations(?:\/|$)/,
    methods: {
      GET: {
        scope: 'global',
        roles: ['admin', 'teacher', 'parent'],
      },
    },
  },
];

const rolePolicies = [
  ...groupPolicies,
  ...routePolicies,
  ...userPolicies,
  ...auditLogPolicies,
  ...resourcePolicies,
];

export { groupPolicies, routePolicies, userPolicies, auditLogPolicies, resourcePolicies };

export default rolePolicies;
