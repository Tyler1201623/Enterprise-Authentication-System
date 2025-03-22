import jsPDF from "jspdf";
import "jspdf-autotable";
import { LogRecord, UserRecord } from "./database";

/**
 * Generate a PDF report of user accounts
 * @param users Array of user records to include in the report
 * @returns The generated PDF document as a data URL
 */
export const generateUserReportPDF = (users: UserRecord[]): string => {
  try {
    // Check if users array is valid
    if (!users || !Array.isArray(users)) {
      throw new Error("Invalid users data for PDF generation");
    }

    // Create new PDF document
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.text("HIPAA-Compliant User Accounts Report", 14, 22);

    // Add timestamp
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

    // Add compliance notice
    doc.setFont("helvetica", "italic");
    doc.text("CONFIDENTIAL - Contains Protected Health Information", 14, 35);

    // Safely prepare table data with null/undefined checks
    const tableData = users.map((user) => [
      user?.id ? user.id.substring(0, 8) + "..." : "N/A",
      user?.email || "N/A",
      user?.role || "N/A",
      user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A",
      user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never",
    ]);

    // Add the table
    (doc as any).autoTable({
      head: [["ID", "Email", "Role", "Created On", "Last Login"]],
      body: tableData,
      startY: 40,
      styles: { overflow: "ellipsize", cellWidth: "wrap" },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: "auto" },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 },
      },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    // Add footer with page numbers
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height
        ? pageSize.height
        : pageSize.getHeight();
      doc.text(
        `HIPAA-Compliant Authentication System - Page ${i} of ${pageCount}`,
        pageSize.width / 2,
        pageHeight - 10,
        { align: "center" }
      );
    }

    // Return the PDF as data URI
    return doc.output("dataurlstring");
  } catch (error) {
    console.error("Error generating user PDF:", error);
    throw new Error(`Failed to generate PDF: ${error}`);
  }
};

/**
 * Generate a PDF report of audit logs
 * @param logs Array of log records to include in the report
 * @returns The generated PDF document as a data URL
 */
export const generateAuditLogReportPDF = (logs: LogRecord[]): string => {
  try {
    // Check if logs array is valid
    if (!logs || !Array.isArray(logs)) {
      throw new Error("Invalid logs data for PDF generation");
    }

    // Create new PDF document in landscape for better table fit
    const doc = new jsPDF({ orientation: "landscape" });

    // Add title
    doc.setFontSize(18);
    doc.text("HIPAA-Compliant Audit Log Report", 14, 22);

    // Add timestamp and compliance notice
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.setFont("helvetica", "italic");
    doc.text("CONFIDENTIAL - Contains Protected Health Information", 14, 35);

    // Safely process logs to format for table
    const tableData = logs.map((log) => {
      // Format details as string, ensuring it doesn't break the PDF
      let detailsStr = "";
      if (log.details) {
        try {
          detailsStr =
            typeof log.details === "string"
              ? log.details
              : JSON.stringify(log.details);

          if (detailsStr.length > 50) {
            detailsStr = detailsStr.substring(0, 47) + "...";
          }
        } catch (e) {
          detailsStr = "Invalid details format";
        }
      }

      return [
        log?.id ? log.id.substring(0, 6) + "..." : "N/A",
        log?.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A",
        log?.user || "System",
        log?.action || "N/A",
        log?.level ? log.level.toUpperCase() : "N/A",
        detailsStr,
      ];
    });

    // Add the table
    (doc as any).autoTable({
      head: [["ID", "Timestamp", "User", "Action", "Level", "Details"]],
      body: tableData,
      startY: 40,
      styles: { overflow: "ellipsize", cellWidth: "wrap", fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
        3: { cellWidth: 40 },
        4: { cellWidth: 20 },
        5: { cellWidth: "auto" },
      },
      headStyles: { fillColor: [155, 89, 182], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    // Add footer with page numbers
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height
        ? pageSize.height
        : pageSize.getHeight();
      doc.text(
        `HIPAA-Compliant Authentication System - Audit Log Report - Page ${i} of ${pageCount}`,
        pageSize.width / 2,
        pageHeight - 10,
        { align: "center" }
      );
    }

    // Return the PDF as data URI
    return doc.output("dataurlstring");
  } catch (error) {
    console.error("Error generating log PDF:", error);
    throw new Error(`Failed to generate PDF: ${error}`);
  }
};

/**
 * Helper to download PDF
 */
export const downloadPdf = (blob: Blob | string, filename: string): void => {
  try {
    let url: string;

    if (typeof blob === "string" && blob.startsWith("data:application/pdf")) {
      // If it's already a data URL
      url = blob;
    } else if (blob instanceof Blob) {
      // If it's a Blob object
      url = URL.createObjectURL(blob);
    } else {
      throw new Error("Invalid PDF data format");
    }

    // Create a temporary link element and trigger download
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      if (url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    }, 100);
  } catch (error) {
    console.error("Error downloading PDF:", error);
    throw new Error(`Failed to download PDF: ${error}`);
  }
};
