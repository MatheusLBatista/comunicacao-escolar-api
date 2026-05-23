class EventFilterBuilder {
  constructor() {
    this.filters = {};
  }

  withSchoolId(school_id) {
    if (school_id) {
      this.filters.school_id = school_id;
    }

    return this;
  }

  withSchoolIds(schoolIds) {
    if (Array.isArray(schoolIds) && schoolIds.length > 0) {
      this.filters.school_id = { $in: schoolIds };
    } else if (Array.isArray(schoolIds) && schoolIds.length === 0) {
      this.filters.school_id = { $in: [] };
    }

    return this;
  }

  withType(type) {
    if (type) {
      this.filters.type = type;
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

  withScope(scope) {
    if (scope) {
      this.filters['target.scope'] = scope;
    }

    return this;
  }

  withTargetIds(target_ids) {
    if (Array.isArray(target_ids) && target_ids.length > 0) {
      this.filters['target.target_ids'] = { $in: target_ids };
    } else if (target_ids && !Array.isArray(target_ids)) {
      this.filters['target.target_ids'] = target_ids;
    }

    return this;
  }

  withStartDateRange(start_date, end_date) {
    if (start_date || end_date) {
      this.filters.start_date = {};

      if (start_date) {
        this.filters.start_date.$gte = new Date(start_date);
      }

      if (end_date) {
        this.filters.start_date.$lte = new Date(end_date);
      }
    }

    return this;
  }

  withParentClassFilter(classIds) {
    if (Array.isArray(classIds)) {
      this.filters.$or = [
        { 'target.scope': 'all' },
        { 'target.target_ids': { $in: classIds } },
      ];
    }
    return this;
  }

  build() {
    return this.filters;
  }
}

export default EventFilterBuilder;
