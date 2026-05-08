class ClassFilterBuilder {
  constructor() {
    this.filters = {};
  }

  withSchoolId(school_id) {
    if (school_id) {
      this.filters.school_id = school_id;
    }

    return this;
  }

  withName(name) {
    if (name) {
      this.filters.name = { $regex: name, $options: 'i' };
    }

    return this;
  }

  withShift(shift) {
    if (shift) {
      this.filters.shift = { $regex: shift, $options: 'i' };
    }

    return this;
  }

  withYear(year) {
    if (year !== undefined && year !== null && year !== '') {
      const parsedYear = Number(year);
      if (!Number.isNaN(parsedYear)) {
        this.filters.year = parsedYear;
      }
    }

    return this;
  }

  withTeacherId(teacher_id) {
    if (teacher_id) {
      this.filters.teacher_ids = teacher_id;
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

export default ClassFilterBuilder;
