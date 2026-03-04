class GroupFilterBuilder {
  constructor() {
    this.filtros = {};
  }

  comNome(nome) {
    if (nome) {
      const nomeEscapado = this.escapeRegex(nome);
      this.filtros.nome = { $regex: nomeEscapado, $options: 'i' };
    }
    return this;
  }

  comDescricao(descricao) {
    if (descricao) {
      const descricaoEscapada = this.escapeRegex(descricao);
      this.filtros.descricao = { $regex: descricaoEscapada, $options: 'i' };
    }
    return this;
  }

  comAtivo(active) {
    if (active === 'true') {
      this.filtros.ativo = true;
    } else if (active === 'false') {
      this.filtros.ativo = false;
    } else {
      this.filtros.ativo = this.filtros.ativo;
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

export default GroupFilterBuilder;
