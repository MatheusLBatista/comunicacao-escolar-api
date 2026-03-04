import UsuarioModel from '../../models/Usuario.js';
import UsuarioRepository from '../UsuarioRepository.js';

class UsuarioFilterBuilder {
  constructor() {
    this.filtros = {};
    this.usuarioRepository = new UsuarioRepository();
    this.usuarioModel = UsuarioModel;
  }

  comNome(full_name) {
    if (full_name) {
      this.filtros.full_name = { $regex: full_name, $options: 'i' };
    }
    return this;
  }

  comEmail(email) {
    if (email) {
      this.filtros.email = { $regex: email, $options: 'i' };
    }
    return this;
  }

  comAtivo(active = 'true') {
    if (active === 'true') {
      this.filtros.active = true;
    }
    if (active === 'false') {
      this.filtros.active = false;
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

export default UsuarioFilterBuilder;
