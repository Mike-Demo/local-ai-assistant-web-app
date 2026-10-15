declare module '@tgwf/co2' {
  export const co2: {
    new (): {
      perByte: (bytes: number, green?: boolean) => number;
    };
  };
}
