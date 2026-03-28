class EventFilterBuilder {
  constructor() {
    this.filters = {};
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

  build() {
    return this.filters;
  }
}

export default EventFilterBuilder;
