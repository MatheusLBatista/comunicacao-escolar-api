// src/repositories/utils/RotaFilterBuilder.js

class RotaFilterBuilder {
  constructor() {
    this.filtros = {};
  }

  comRota(route) {
    if (route) {
      this.filtros.route = { $regex: route, $options: 'i' };
    }
    return this;
  }

  comDominio(domain) {
    if (domain) {
      this.filtros.domain = { $regex: domain, $options: 'i' };
    }
    return this;
  }

  comAtivo(active) {
    if (active === 'true') {
      this.filtros.active = true;
    } else if (active === 'false') {
      this.filtros.active = false;
    }
    return this;
  }

  comGet(get) {
    if (get === 'true') {
      this.filtros.get = true;
    } else if (get === 'false') {
      this.filtros.get = false;
    }
    return this;
  }

  comPost(post) {
    if (post === 'true') {
      this.filtros.post = true;
    } else if (post === 'false') {
      this.filtros.post = false;
    }
    return this;
  }

  comPut(put) {
    if (put === 'true') {
      this.filtros.put = true;
    } else if (put === 'false') {
      this.filtros.put = false;
    }
    return this;
  }

  comPatch(patch) {
    if (patch === 'true') {
      this.filtros.patch = true;
    } else if (patch === 'false') {
      this.filtros.patch = false;
    }
    return this;
  }

  comDelete(del) {
    if (del === 'true') {
      this.filtros.delete = true;
    } else if (del === 'false') {
      this.filtros.delete = false;
    }
    return this;
  }

  build() {
    return this.filtros;
  }
}

export default RotaFilterBuilder;
