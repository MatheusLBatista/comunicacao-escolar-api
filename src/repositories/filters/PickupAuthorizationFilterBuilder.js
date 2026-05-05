class PickupAuthorizationFilterBuilder {
  constructor() {
    this.filters = {};
  }

  withSchoolId(school_id) {
    if (school_id) {
      this.filters.school_id = school_id;
    }

    return this;
  }

  withStudentId(student_id) {
    if (student_id) {
      this.filters.student_id = student_id;
    }

    return this;
  }

  withStudentIds(studentIds) {
    if (Array.isArray(studentIds)) {
      if (studentIds.length === 0) {
        this.filters.student_id = { $in: [] };
      } else if (!this.filters.student_id) {
        this.filters.student_id = { $in: studentIds };
      } else {
        const requested = this.filters.student_id.toString();
        this.filters.student_id = studentIds.includes(requested)
          ? requested
          : { $in: [] };
      }
    }

    return this;
  }

  withAuthorizedBy(authorized_by) {
    if (authorized_by) {
      this.filters.authorized_by = authorized_by;
    }

    return this;
  }

  withUsed(used) {
    if (used === 'true' || used === true) {
      this.filters.used = true;
    } else if (used === 'false' || used === false) {
      this.filters.used = false;
    }

    return this;
  }

  withActive(active) {
    if (active === 'true' || active === true) {
      this.filters.active = true;
    } else if (active === 'false' || active === false) {
      this.filters.active = false;
    }

    return this;
  }

  build() {
    return this.filters;
  }
}

export default PickupAuthorizationFilterBuilder;
