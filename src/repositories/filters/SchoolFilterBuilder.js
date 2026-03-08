import School from "../../models/School.js";

class SchoolFilterBuilder {
  constructor() {
    this.filters = {};
    this.schoolModel = new School();
  }

  withName(name) {
    if (name) {
      this.filters.name = { $regex: name, $options: "i" };
    }

    return this;
  }

  withTaxId(tax_id) {
    if (tax_id) {
      this.filters.tax_id = { $regex: tax_id, $options: "i" };
    }

    return this;
  }

  withActive(active) {
    if (active !== undefined) {
      this.filters.active = active === "true" || active === true;
    }

    return this;
  }

  withCity(city) {
    if (city) {
      this.filters["address.city"] = { $regex: city, $options: "i" };
    }

    return this;
  }

  withState(state) {
    if (state) {
      this.filters["address.state"] = { $regex: state, $options: "i" };
    }

    return this;
  }

  withZipCode(zip_code) {
    if (zip_code) {
      this.filters["address.zip_code"] = { $regex: zip_code, $options: "i" };
    }

    return this;
  }

  withAddress(address) {
    if (address) {
      this.filters.$or = [
        { "address.street": { $regex: address, $options: "i" } },
        { "address.number": { $regex: address, $options: "i" } },
        { "address.city": { $regex: address, $options: "i" } },
        { "address.state": { $regex: address, $options: "i" } },
        { "address.zip_code": { $regex: address, $options: "i" } }
      ];
    }

    return this;
  }

  build() {
    return this.filters;
  }
}

export default SchoolFilterBuilder;
