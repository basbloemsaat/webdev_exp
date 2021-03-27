class PageVar {
  private params: URLSearchParams;
  constructor() {
    this.params = new URLSearchParams(document.location.search);
  }

  set(varname: string, value: any) {
    this.params.set(varname, value);
    history.pushState(this.params.toString(), "", "?" + this.params.toString());
  }
  get(varname: string, default_value?: string): string {
    let value = this.params.get(varname);
    if (value === null && default_value !== undefined) {
      this.set(varname, default_value);
      value = default_value;
    }
    return value;
  }
}

let page_variables = new PageVar();

export { page_variables };
