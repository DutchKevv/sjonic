declare module '*.html' {
    var _: string;
    export default  _;
}

declare module '*.hbs' {
    var _: Function;
    export default  _;
}

declare module 'handlebars-utils' {
    var _: any;
    export default  _;
}

declare module "*.json" {
    const value: any;
    export default value;
}