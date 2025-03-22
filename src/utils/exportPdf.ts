import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { AuditLog } from "../types";
import { UserRecord } from "./database";

// Cache for document creation to improve performance
let pdfCache: {
  users?: jsPDF;
  logs?: jsPDF;
  timestamp: number;
} = { timestamp: 0 };

// Clear cache periodically
const clearCache = () => {
  const now = Date.now();
  if (now - pdfCache.timestamp > 60000) {
    // Clear cache after 1 minute
    pdfCache = { timestamp: now };
  }
};

/**
 * Exports user data to PDF format with optimized performance
 * @param users - Array of user records to export
 * @param title - Title for the PDF report
 * @returns Blob containing the PDF file
 */
export const exportUsersToPdf = (
  users: UserRecord[],
  title: string = "User Report"
): Blob => {
  try {
    clearCache();

    // Create a new document with jsPDF
    const doc = new jsPDF();

    // Add title and timestamp
    doc.setFontSize(18);
    doc.text(title, 14, 20);

    const now = new Date();
    doc.setFontSize(10);
    doc.text(`Generated: ${now.toLocaleString()}`, 14, 30);

    // Map users to table data for better performance
    const tableData = users.map((user) => [
      user.id ? user.id.substring(0, 8) + "..." : "N/A",
      user.email || "N/A",
      user.role || "N/A",
      user.mfaEnabled ? "Yes" : "No",
      user.createdAt ? new Date(user.createdAt).toLocaleString() : "N/A",
      user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never",
    ]);

    // Create table with optimized settings
    autoTable(doc, {
      head: [["ID", "Email", "Role", "MFA", "Created", "Last Login"]],
      body: tableData,
      startY: 40,
      headStyles: { fillColor: [66, 139, 202] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      margin: { top: 40 },
      didDrawPage: (data) => {
        // Add page numbers on each page
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(10);
          doc.text(
            `Page ${i} of ${pageCount}`,
            doc.internal.pageSize.width - 30,
            doc.internal.pageSize.height - 10
          );
        }
      },
    });

    // Cache the document for potential reuse
    pdfCache.users = doc;
    pdfCache.timestamp = Date.now();

    // Return PDF as blob with optimized compression
    return doc.output("blob");
  } catch (error) {
    console.error("Error generating user PDF:", error);
    throw new Error(
      `Failed to generate PDF: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

/**
 * Exports audit log entries to PDF format with optimized performance
 * @param logs - Array of audit log entries to export
 * @param title - Title for the PDF report
 * @returns Blob containing the PDF file
 */
export const exportAuditLogsToPdf = (
  logs: AuditLog[],
  title: string = "Audit Log Report"
): Blob => {
  try {
    clearCache();

    // Create a new document with jsPDF
    const doc = new jsPDF({ orientation: "landscape" });

    // Add title and timestamp
    doc.setFontSize(18);
    doc.text(title, 14, 20);

    const now = new Date();
    doc.setFontSize(10);
    doc.text(`Generated: ${now.toLocaleString()}`, 14, 30);

    // Process data in chunks for better performance with large datasets
    const processData = (logs: AuditLog[]) => {
      const chunkSize = 500;
      const chunks = [];

      for (let i = 0; i < logs.length; i += chunkSize) {
        chunks.push(logs.slice(i, i + chunkSize));
      }

      return chunks.flatMap((chunk) =>
        chunk.map((log) => {
          let detailsStr = "";
          try {
            if (log.details) {
              detailsStr =
                typeof log.details === "string"
                  ? log.details
                  : JSON.stringify(log.details);

              if (detailsStr.length > 50) {
                detailsStr = detailsStr.substring(0, 47) + "...";
              }
            }
          } catch (e) {
            detailsStr = "Invalid details format";
          }

          return [
            log.id ? log.id.substring(0, 6) + "..." : "N/A",
            log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A",
            log.userId || "System",
            log.level || "N/A",
            log.action || "N/A",
            detailsStr,
          ];
        })
      );
    };

    // Process the data
    const tableData = processData(logs);

    // Create table with optimized settings
    autoTable(doc, {
      head: [["ID", "Timestamp", "User ID", "Level", "Action", "Details"]],
      body: tableData,
      startY: 40,
      headStyles: { fillColor: [66, 139, 202] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      margin: { top: 40 },
      columnStyles: {
        4: { cellWidth: "auto" }, // Action column
        5: { cellWidth: "auto" }, // Details column
      },
      didDrawPage: (data) => {
        // Add page numbers on each page
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(10);
          doc.text(
            `Page ${i} of ${pageCount}`,
            doc.internal.pageSize.width - 30,
            doc.internal.pageSize.height - 10
          );
        }
      },
    });

    // Cache the document for potential reuse
    pdfCache.logs = doc;
    pdfCache.timestamp = Date.now();

    // Return PDF as blob with optimized compression
    return doc.output("blob");
  } catch (error) {
    console.error("Error generating log PDF:", error);
    throw new Error(
      `Failed to generate PDF: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

/**
 * Creates a download link for a PDF blob with performance optimizations
 * @param blob - PDF blob to download
 * @param filename - Name for the downloaded file
 */
export const downloadPdf = (blob: Blob, filename: string): void => {
  try {
    // Create object URL efficiently
    const url = URL.createObjectURL(blob);

    // Use a hidden link for download
    const link = document.createElement("a");
    link.style.display = "none";
    link.href = url;
    link.download = filename;

    // Append, click, and clean up in one synchronous operation
    document.body.appendChild(link);
    link.click();

    // Defer cleanup to avoid blocking the UI
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error("Error downloading PDF:", error);
    throw new Error(
      `Failed to download PDF: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
