class UserFilterBuilder {
  constructor() {
    this.filtros = {};
  }

  withName(full_name) {
    if (full_name) {
      const nomeEscapado = this.escapeRegex(full_name);
      this.filtros.full_name = { $regex: nomeEscapado, $options: 'i' };
    }
    return this;
  }

  withEmail(email) {
    if (email) {
      const emailEscapado = this.escapeRegex(email);
      this.filtros.email = { $regex: emailEscapado, $options: 'i' };
    }
    return this;
  }

  withActive(active) {
    if (active === 'true') {
      this.filtros.active = true;
    } else if (active === 'false') {
      this.filtros.active = false;
    }
    return this;
  }

  withRole(role, schoolId) {
    if (role && schoolId) {
      this.filtros.memberships = {
        $elemMatch: {
          school_id: schoolId,
          role: role,
        },
      };
    } else if (schoolId) {
      this.filtros['memberships.school_id'] = schoolId;
    }
    return this;
  }

  escapeRegex(texto) {
    return texto.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  }

  build() {
    return this.filtros;
  }
}

export default UserFilterBuilder;
