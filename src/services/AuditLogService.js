import AuditLogRepository from '../repositories/AuditLogRepository.js';
import User from '../models/User.js';

class AuditLogService {
  constructor() {
    this.repository = new AuditLogRepository();
  }

  async list(req) {
    return this.repository.list(req);
  }

  async summary(req) {
    return this.repository.summary(req);
  }

  async create(data) {
    return this.repository.create(data);
  }

  /**
   * context: Express req object OR plain { user_id }
   */
  logAsync(context, options) {
    const actorId = context?.user_id;
    const ip = context?.headers
      ? (context.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
          context.ip ||
          context?.socket?.remoteAddress ||
          '')
      : '';
    const userAgent = context?.headers?.['user-agent'] || '';

    this._createLog(actorId, { ...options, ip, userAgent }).catch((err) =>
      console.error('[AuditLog] logAsync error:', err.message),
    );
  }

  async _createLog(
    actorId,
    {
      schoolId,
      resourceType,
      resourceId,
      resourceSummary = '',
      studentId = null,
      action,
      userRole = null,
      ip = '',
      userAgent = '',
    },
  ) {
    if (!actorId || !schoolId || !resourceId) return;

    let role = userRole;
    if (!role) {
      const user = await User.findById(actorId).select('memberships').lean();
      const membership = user?.memberships?.find(
        (m) => String(m.school_id) === String(schoolId),
      );
      role = membership?.role;
    }

    if (!role || !['admin', 'teacher', 'parent'].includes(role)) return;

    await this.repository.create({
      school_id: schoolId,
      user_id: actorId,
      user_role: role,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      resource_summary: resourceSummary,
      student_id: studentId || null,
      ip_address: ip,
      user_agent: userAgent,
      device_info: {
        platform: _parsePlatform(userAgent),
        app_version: '',
        os_version: '',
      },
      session_id: '',
    });
  }
}

function _parsePlatform(userAgent = '') {
  const ua = userAgent.toLowerCase();
  if (ua.includes('android')) return 'android';
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios'))
    return 'ios';
  return 'web';
}

export default AuditLogService;
