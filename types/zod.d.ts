declare module 'zod' {
  export const z: any;
  export namespace z {
    type infer<T> = any;
  }
}
