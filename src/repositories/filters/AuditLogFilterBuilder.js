class AuditLogFilterBuilder {
  constructor() {
    this.filters = {};
  }

  withSchoolId(schoolId) {
    if (schoolId) {
      this.filters.school_id = schoolId;
    }

    return this;
  }

  withUserId(userId) {
    if (userId) {
      this.filters.user_id = userId;
    }

    return this;
  }

  withResourceType(resourceType) {
    if (resourceType) {
      this.filters.resource_type = resourceType;
    }

    return this;
  }

  withResourceId(resourceId) {
    if (resourceId) {
      this.filters.resource_id = resourceId;
    }

    return this;
  }

  withStudentId(studentId) {
    if (studentId) {
      this.filters.student_id = studentId;
    }

    return this;
  }

  withAction(action) {
    if (action) {
      this.filters.action = action;
    }

    return this;
  }

  withDateRange(startDate, endDate) {
    if (startDate || endDate) {
      this.filters.created_at = {};

      if (startDate) {
        this.filters.created_at.$gte = new Date(startDate);
      }

      if (endDate) {
        this.filters.created_at.$lte = new Date(endDate);
      }
    }

    return this;
  }

  build() {
    return this.filters;
  }
}

export default AuditLogFilterBuilder;
