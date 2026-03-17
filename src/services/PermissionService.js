import UserRepository from '../repositories/UserRepository.js';
import { CustomError, messages } from '../utils/helpers/index.js';
import rolePolicies from '../config/accessPolicies.js';

class PermissionService {
  constructor() {
    this.repository = new UserRepository();
    this.messages = messages;
    this.rolePolicies = rolePolicies;
  }

  getMemberships(user) {
    return Array.isArray(user?.memberships) ? user.memberships : [];
  }

  hasGlobalRole(user, allowedRoles = []) {
    const memberships = this.getMemberships(user);
    return memberships.some((membership) =>
      allowedRoles.includes(membership?.role),
    );
  }

  hasRoleInSchool(user, schoolId, allowedRoles = []) {
    if (!schoolId) return false;

    const schoolIdAsString = schoolId.toString();
    const memberships = this.getMemberships(user);

    return memberships.some(
      (membership) =>
        membership?.school_id?.toString() === schoolIdAsString &&
        allowedRoles.includes(membership?.role),
    );
  }

  normalizeRequestPath(requestPath) {
    if (!requestPath) return '';

    const path = requestPath.split('?')[0].toLowerCase();
    if (path.length > 1 && path.endsWith('/')) {
      return path.slice(0, -1);
    }

    return path;
  }

  resolveSchoolId(params = {}, path, policy) {
    if (!policy?.schoolParam) return null;

    if (params?.[policy.schoolParam]) {
      return params[policy.schoolParam];
    }

    const match = path.match(/^\/schools\/([^/]+)\//);
    if (match?.[1]) {
      return match[1];
    }

    return null;
  }

  validateRoleAccess(user, requestPath, httpMethod, params = {}) {
    const path = this.normalizeRequestPath(requestPath);
    const method = (httpMethod || '').toUpperCase();

    const matchedPolicy = this.rolePolicies.find((policy) =>
      policy.pattern.test(path),
    );

    if (!matchedPolicy) {
      return true;
    }

    const rule = matchedPolicy.methods[method] || matchedPolicy.methods['*'];
    if (!rule) {
      return false;
    }

    if (rule.scope === 'school') {
      const schoolId = this.resolveSchoolId(params, path, rule);
      return this.hasRoleInSchool(user, schoolId, rule.roles || []);
    }

    return this.hasGlobalRole(user, rule.roles || []);
  }

  async hasPermission(
    userId,
    route,
    domain,
    method,
    params = {},
    httpMethod = '',
    requestPath = '',
  ) {
    try {
      const user = await this.repository.getById(userId);
      if (!user) {
        throw new CustomError({
          statusCode: 404,
          errorType: 'resourceNotFound',
          field: 'Usuário',
          details: [],
          customMessage: messages.error.resourceNotFound('Usuário'),
        });
      }

      if (Array.isArray(user.groups) && user.groups.length > 0) {
        await user.populate({ path: 'groups', select: 'permissions' });
      }

      const hasRoleAccess = this.validateRoleAccess(
        user,
        requestPath,
        httpMethod,
        params,
      );

      if (!hasRoleAccess) {
        return false;
      }

      let permissions = user.permissions || [];

      if (Array.isArray(user.groups)) {
        for (const group of user.groups) {
          permissions = permissions.concat(group.permissions || []);
        }
      }

      const uniquePermissions = [];
      const combinations = new Set();

      permissions.forEach((permission) => {
        const key = `${permission.route}_${permission.domain}`;
        if (!combinations.has(key)) {
          combinations.add(key);
          uniquePermissions.push(permission);
        }
      });

      const hasPermission = uniquePermissions.some((permission) => {
        return (
          permission.route === route &&
          permission.domain === domain &&
          permission.active &&
          permission[method]
        );
      });

      return hasPermission;
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return false;
    }
  }
}

export default PermissionService;
