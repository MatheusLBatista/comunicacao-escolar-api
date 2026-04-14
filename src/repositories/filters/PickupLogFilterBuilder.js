class PickupLogFilterBuilder {
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

  withAuthorizationId(authorization_id) {
    if (authorization_id) {
      this.filters.authorization_id = authorization_id;
    }

    return this;
  }

  withVerifiedBy(verified_by) {
    if (verified_by) {
      this.filters.verified_by = verified_by;
    }

    return this;
  }

  withMethod(method) {
    if (method) {
      this.filters.method = method;
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

  withDepartureTimeRange(start_date, end_date) {
    if (start_date || end_date) {
      this.filters.departure_time = {};

      if (start_date) {
        this.filters.departure_time.$gte = new Date(start_date);
      }

      if (end_date) {
        this.filters.departure_time.$lte = new Date(end_date);
      }
    }

    return this;
  }

  build() {
    return this.filters;
  }
}

export default PickupLogFilterBuilder;
