export class APIResponseError extends Error {
  statusCode?: number;
  code?: number;
  path?: string;
  method?: string;
  rawResponse?: any;
  constructor(
    message: string,
    options: {
      statusCode?: number;
      code?: number;
      path?: string;
      method?: string;
      rawResponse?: any;
    } = {},
  ) {
    super(message);
    this.name = "APIResponseError";
    this.statusCode = options["statusCode"];
    this.code = this.statusCode;
    this.path = options["path"];
    this.method = options["method"];
    this.code = options["code"];
    this.rawResponse = options["rawResponse"];
    this.stack = new Error().stack;
  }
}
