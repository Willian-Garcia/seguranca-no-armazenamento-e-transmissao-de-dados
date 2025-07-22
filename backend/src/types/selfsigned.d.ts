declare module 'selfsigned' {
    interface CertOptions {
      days?: number;
      keySize?: number;
      algorithm?: string;
    }
  
    interface CertResult {
      private: string;
      public: string;
      cert: string;
    }
  
    function generate(
      attrs?: any[],
      options?: CertOptions
    ): CertResult;
  
    export { generate };
    export default { generate };
  }
  