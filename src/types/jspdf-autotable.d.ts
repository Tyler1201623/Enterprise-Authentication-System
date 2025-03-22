import "jspdf";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    internal: {
      getNumberOfPages: () => number;
      pageSize: {
        width: number;
        height?: number;
        getHeight: () => number;
      };
    };
  }
}
