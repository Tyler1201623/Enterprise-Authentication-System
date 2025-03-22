declare module "crypto-js";
declare module "react-window";
declare module "pako";
declare module "process/browser";
declare module "path-browserify";
declare module "vm-browserify";
declare module "assert";
declare module "browserify-zlib";

interface Window {
  process: any;
  Buffer: typeof Buffer;
  passwordlessAuth: any;
}
