import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Extract distinct/representative start and end dates from records list.
 */
export function extractDateRange(records, selectedDateFilter = 'all') {
  if (selectedDateFilter && selectedDateFilter !== 'all') {
    const matching = records.find(r => r.dateStart === selectedDateFilter);
    return {
      startDate: selectedDateFilter,
      endDate: matching?.dateEnd || '',
    };
  }

  const startDates = [...new Set(records.map(r => r.dateStart).filter(Boolean))];
  const endDates = [...new Set(records.map(r => r.dateEnd).filter(Boolean))];

  return {
    startDate: startDates.length === 1 ? startDates[0] : (startDates[0] || ''),
    endDate: endDates.length === 1 ? endDates[0] : (endDates[0] || ''),
    allStartDates: startDates,
    allEndDates: endDates,
  };
}

/**
 * Format cell value helper
 */
const formatVal = (val) => {
  if (val === '' || val === null || val === undefined) return '-';
  return String(val);
};

/**
 * Build HTML table content for History Report (Name col to All Pending Till Date).
 */
function buildHistoryReportHTML({
  categoryName = 'MIS Category Report',
  startDate = '',
  endDate = '',
  records = [],
  averages = null,
  filters = {},
}) {
  const generatedTime = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const dateRangeDisplay = (startDate || endDate)
    ? `${startDate || '-'} to ${endDate || '-'}`
    : 'All Dates';

  let activeFiltersText = [];
  if (filters.firm && filters.firm !== 'all') activeFiltersText.push(`Firm: ${filters.firm}`);
  if (filters.name && filters.name !== 'all') activeFiltersText.push(`Name: ${filters.name}`);
  if (filters.search) activeFiltersText.push(`Search: "${filters.search}"`);

  let rowsHtml = '';
  records.forEach((r, idx) => {
    const wnd = parseFloat(r.workNotDone) || 0;
    const wndot = parseFloat(r.workNotDoneOnTime) || 0;
    const wp = parseFloat(r.weekPending) || 0;
    const ap = parseFloat(r.allPendingTillDate) || 0;

    const wndColor = wnd > 30 ? '#991b1b' : (wnd > 10 ? '#854d0e' : '#166534');
    const wndBg = wnd > 30 ? '#fee2e2' : (wnd > 10 ? '#fef9c3' : '#dcfce7');

    const wndotColor = wndot > 30 ? '#991b1b' : (wndot > 10 ? '#854d0e' : '#166534');
    const wndotBg = wndot > 30 ? '#fee2e2' : (wndot > 10 ? '#fef9c3' : '#dcfce7');

    const wpColor = wp > 5 ? '#991b1b' : (wp > 0 ? '#854d0e' : '#166534');
    const wpBg = wp > 5 ? '#fee2e2' : (wp > 0 ? '#fef9c3' : '#dcfce7');

    const apColor = ap > 10 ? '#991b1b' : (ap > 3 ? '#854d0e' : '#166534');
    const apBg = ap > 10 ? '#fee2e2' : (ap > 3 ? '#fef9c3' : '#dcfce7');

    const rowBg = idx % 2 === 0 ? '#ffffff' : '#f9fafb';

    rowsHtml += `
      <tr style="background-color: ${rowBg}; page-break-inside: avoid; break-inside: avoid;">
        <td style="padding: 6px 4px; text-align: center; color: #6b7280; font-weight: 500; border-bottom: 1px solid #e5e7eb;">${idx + 1}</td>
        <td style="padding: 6px 6px; text-align: center; font-weight: 600; color: #111827; border-bottom: 1px solid #e5e7eb;">${formatVal(r.name)}</td>
        <td style="padding: 6px 4px; text-align: center; color: #4b5563; border-bottom: 1px solid #e5e7eb;">${formatVal(r.firm)}</td>
        <td style="padding: 6px 4px; text-align: center; color: #374151; font-weight: 600; border-bottom: 1px solid #e5e7eb;">${formatVal(r.target)}</td>
        <td style="padding: 6px 4px; text-align: center; border-bottom: 1px solid #e5e7eb;">
          <span style="display: inline-block; padding: 2px 6px; background-color: #dcfce7; color: #166534; font-weight: 700; border-radius: 4px; font-size: 10px;">
            ${formatVal(r.actualWorkDone)}
          </span>
        </td>
        <td style="padding: 6px 4px; text-align: center; border-bottom: 1px solid #e5e7eb;">
          <span style="display: inline-block; padding: 2px 6px; background-color: ${wndBg}; color: ${wndColor}; font-weight: 700; border-radius: 4px; font-size: 10px;">
            ${formatVal(r.workNotDone)}
          </span>
        </td>
        <td style="padding: 6px 4px; text-align: center; border-bottom: 1px solid #e5e7eb;">
          <span style="display: inline-block; padding: 2px 6px; background-color: ${wndotBg}; color: ${wndotColor}; font-weight: 700; border-radius: 4px; font-size: 10px;">
            ${formatVal(r.workNotDoneOnTime)}
          </span>
        </td>
        <td style="padding: 6px 4px; text-align: center; border-bottom: 1px solid #e5e7eb;">
          <span style="display: inline-block; padding: 2px 6px; background-color: #e0e7ff; color: #3730a3; font-weight: 700; border-radius: 4px; font-size: 10px;">
            ${formatVal(r.totalWorkDone)}
          </span>
        </td>
        <td style="padding: 6px 4px; text-align: center; border-bottom: 1px solid #e5e7eb;">
          <span style="display: inline-block; padding: 2px 6px; background-color: ${wpBg}; color: ${wpColor}; font-weight: 700; border-radius: 4px; font-size: 10px;">
            ${formatVal(r.weekPending)}
          </span>
        </td>
        <td style="padding: 6px 4px; text-align: center; border-bottom: 1px solid #e5e7eb;">
          <span style="display: inline-block; padding: 2px 6px; background-color: ${apBg}; color: ${apColor}; font-weight: 700; border-radius: 4px; font-size: 10px;">
            ${formatVal(r.allPendingTillDate)}
          </span>
        </td>
      </tr>
    `;
  });

  let averageRowHtml = '';
  if (averages && records.length > 0) {
    averageRowHtml = `
      <tr style="background-color: #f3f4f6; font-weight: bold; border-top: 2px solid #16555a; border-bottom: 2px solid #16555a; page-break-inside: avoid; break-inside: avoid;">
        <td colspan="3" style="padding: 7px 8px; text-align: center; color: #111827; font-size: 11px; text-transform: uppercase;">Average:</td>
        <td style="padding: 7px 4px; text-align: center; color: #111827; font-size: 11px;">${averages.target}</td>
        <td style="padding: 7px 4px; text-align: center; color: #166534; font-size: 11px;">${averages.actualWorkDone}</td>
        <td style="padding: 7px 4px; text-align: center; color: #111827; font-size: 11px;">${averages.workNotDone}%</td>
        <td style="padding: 7px 4px; text-align: center; color: #111827; font-size: 11px;">${averages.workNotDoneOnTime}%</td>
        <td style="padding: 7px 4px; text-align: center; color: #3730a3; font-size: 11px;">${averages.totalWorkDone}</td>
        <td style="padding: 7px 4px; text-align: center; color: #111827; font-size: 11px;">${averages.weekPending}</td>
        <td style="padding: 7px 4px; text-align: center; color: #111827; font-size: 11px;">${averages.allPendingTillDate}</td>
      </tr>
    `;
  }

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; width: 100%; box-sizing: border-box; margin: 0; padding: 10px;">
      <!-- Header Banner -->
      <div style="border-bottom: 2px solid #16555a; padding-bottom: 12px; margin-bottom: 15px; width: 100%; box-sizing: border-box;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 3px;">
              <h1 style="font-size: 20px; font-weight: 800; color: #124649; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
                MIS Passary
              </h1>
              <span style="font-size: 11px; font-weight: 700; background-color: #24888f; color: #ffffff; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">
                ${categoryName}
              </span>
            </div>
            <p style="font-size: 11px; color: #6b7280; margin: 0;">Performance &amp; Commitment History Report</p>
          </div>

          <!-- Date Range Header Box -->
          <div style="text-align: right;">
            <div style="background-color: #f0fdfa; border: 1.5px solid #24888f; border-radius: 6px; padding: 6px 12px; display: inline-block;">
              <div style="font-size: 9.5px; font-weight: 700; color: #16555a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">
                Report Date Range
              </div>
              <div style="font-size: 13px; font-weight: 800; color: #0c2f31;">
                ${dateRangeDisplay}
              </div>
            </div>
          </div>
        </div>

        <!-- Meta info & Applied Filters -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 8px; border-top: 1px dashed #e5e7eb; font-size: 10.5px; color: #6b7280;">
          <div>
            <span><strong>Total Records:</strong> ${records.length}</span>
            ${activeFiltersText.length > 0 ? `<span style="margin-left: 15px; color: #4b5563;"><strong>Filters:</strong> ${activeFiltersText.join(' | ')}</span>` : ''}
          </div>
          <div>
            <span>Generated: ${generatedTime}</span>
          </div>
        </div>
      </div>

      <!-- Scoped Table: Name to All Pending Till Date -->
      <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; border: 1px solid #d1d5db; table-layout: auto;">
        <thead>
          <tr style="background-color: #16555a; color: #ffffff; text-align: center;">
            <th style="padding: 7px 4px; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; width: 35px; text-align: center; border-right: 1px solid #1d6d72;">S.No</th>
            <th style="padding: 7px 6px; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; text-align: center; border-right: 1px solid #1d6d72;">Name</th>
            <th style="padding: 7px 4px; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; text-align: center; border-right: 1px solid #1d6d72;">Firm</th>
            <th style="padding: 7px 4px; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; text-align: center; border-right: 1px solid #1d6d72;">Target</th>
            <th style="padding: 7px 4px; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; text-align: center; border-right: 1px solid #1d6d72;">Actual Work Done</th>
            <th style="padding: 7px 4px; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; text-align: center; border-right: 1px solid #1d6d72;">% Work Not Done</th>
            <th style="padding: 7px 4px; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; text-align: center; border-right: 1px solid #1d6d72;">% Not Done On Time</th>
            <th style="padding: 7px 4px; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; text-align: center; border-right: 1px solid #1d6d72;">Total Work Done</th>
            <th style="padding: 7px 4px; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; text-align: center; border-right: 1px solid #1d6d72;">Week Pending</th>
            <th style="padding: 7px 4px; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; text-align: center;">All Pending Till Date</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || `<tr><td colspan="10" style="padding: 20px; text-align: center; color: #9ca3af;">No records found.</td></tr>`}
        </tbody>
        ${averageRowHtml ? `<tfoot>${averageRowHtml}</tfoot>` : ''}
      </table>

      <!-- Footer -->
      <div style="margin-top: 15px; display: flex; justify-content: space-between; align-items: center; font-size: 9.5px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px;">
        <span>MIS Passary System • History Performance Report</span>
        <span>Page 1 of 1</span>
      </div>
    </div>
  `;
}

/**
 * Print History Report via browser print window with styled layout.
 * Supports dynamic switching between Portrait and Landscape layout in browser print dialog.
 */
export function printHistoryReport({
  categoryName = 'MIS Category Report',
  startDate = '',
  endDate = '',
  records = [],
  averages = null,
  filters = {},
}) {
  const content = buildHistoryReportHTML({
    categoryName,
    startDate,
    endDate,
    records,
    averages,
    filters,
  });

  const printWindow = window.open('', '_blank', 'width=1100,height=850');
  if (!printWindow) {
    alert('Please allow popups for this site to print the report.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${categoryName} - ${startDate || ''} to ${endDate || ''}</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          * {
            box-sizing: border-box;
          }
          @page {
            margin: 8mm 6mm;
            size: auto;
          }
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            background: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse;
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: auto;
          }
          td, th {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
          @media print {
            html, body {
              width: 100%;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            td, th {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          }
        </style>
      </head>
      <body>
        ${content}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 250);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * Download History Report as PDF via jsPDF & AutoTable (Vector multi-page, never splits rows!).
 */
export async function downloadHistoryPDF({
  categoryName = 'MIS Category Report',
  startDate = '',
  endDate = '',
  records = [],
  averages = null,
  filters = {},
}) {
  try {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape A4 (297mm x 210mm)
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const generatedTime = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const dateRangeDisplay = (startDate || endDate)
      ? `${startDate || '-'} to ${endDate || '-'}`
      : 'All Dates';

    let activeFiltersText = [];
    if (filters.firm && filters.firm !== 'all') activeFiltersText.push(`Firm: ${filters.firm}`);
    if (filters.name && filters.name !== 'all') activeFiltersText.push(`Name: ${filters.name}`);
    if (filters.search) activeFiltersText.push(`Search: "${filters.search}"`);

    // Table Headers
    const head = [
      [
        { content: 'S.NO', styles: { halign: 'center' } },
        { content: 'NAME', styles: { halign: 'center' } },
        { content: 'FIRM', styles: { halign: 'center' } },
        { content: 'TARGET', styles: { halign: 'center' } },
        { content: 'ACTUAL WORK DONE', styles: { halign: 'center' } },
        { content: '% WORK NOT DONE', styles: { halign: 'center' } },
        { content: '% NOT DONE ON TIME', styles: { halign: 'center' } },
        { content: 'TOTAL WORK DONE', styles: { halign: 'center' } },
        { content: 'WEEK PENDING', styles: { halign: 'center' } },
        { content: 'ALL PENDING TILL DATE', styles: { halign: 'center' } },
      ]
    ];

    // Table Body Rows with color styling
    const body = records.map((r, idx) => {
      const wnd = parseFloat(String(r.workNotDone).replace('%', '')) || 0;
      const wndot = parseFloat(String(r.workNotDoneOnTime).replace('%', '')) || 0;
      const wp = parseFloat(String(r.weekPending)) || 0;
      const ap = parseFloat(String(r.allPendingTillDate)) || 0;

      const wndFill = wnd > 30 ? [254, 226, 226] : (wnd > 10 ? [254, 249, 195] : [220, 252, 231]);
      const wndText = wnd > 30 ? [153, 27, 27] : (wnd > 10 ? [133, 77, 14] : [22, 101, 52]);

      const wndotFill = wndot > 30 ? [254, 226, 226] : (wndot > 10 ? [254, 249, 195] : [220, 252, 231]);
      const wndotText = wndot > 30 ? [153, 27, 27] : (wndot > 10 ? [133, 77, 14] : [22, 101, 52]);

      const wpFill = wp > 5 ? [254, 226, 226] : (wp > 0 ? [254, 249, 195] : [220, 252, 231]);
      const wpText = wp > 5 ? [153, 27, 27] : (wp > 0 ? [133, 77, 14] : [22, 101, 52]);

      const apFill = ap > 10 ? [254, 226, 226] : (ap > 3 ? [254, 249, 195] : [220, 252, 231]);
      const apText = ap > 10 ? [153, 27, 27] : (ap > 3 ? [133, 77, 14] : [22, 101, 52]);

      return [
        { content: String(idx + 1), styles: { halign: 'center', textColor: [107, 114, 128] } },
        { content: formatVal(r.name), styles: { halign: 'center', fontStyle: 'bold', textColor: [17, 24, 39] } },
        { content: formatVal(r.firm), styles: { halign: 'center', textColor: [75, 85, 99] } },
        { content: formatVal(r.target), styles: { halign: 'center', fontStyle: 'bold', textColor: [55, 65, 81] } },
        { content: formatVal(r.actualWorkDone), styles: { halign: 'center', fontStyle: 'bold', fillColor: [220, 252, 231], textColor: [22, 101, 52] } },
        { content: formatVal(r.workNotDone), styles: { halign: 'center', fontStyle: 'bold', fillColor: wndFill, textColor: wndText } },
        { content: formatVal(r.workNotDoneOnTime), styles: { halign: 'center', fontStyle: 'bold', fillColor: wndotFill, textColor: wndotText } },
        { content: formatVal(r.totalWorkDone), styles: { halign: 'center', fontStyle: 'bold', fillColor: [224, 231, 255], textColor: [55, 48, 163] } },
        { content: formatVal(r.weekPending), styles: { halign: 'center', fontStyle: 'bold', fillColor: wpFill, textColor: wpText } },
        { content: formatVal(r.allPendingTillDate), styles: { halign: 'center', fontStyle: 'bold', fillColor: apFill, textColor: apText } },
      ];
    });

    // Average Footer Row
    const foot = averages && records.length > 0 ? [
      [
        { content: 'AVERAGE:', colSpan: 3, styles: { halign: 'center', fontStyle: 'bold', textColor: [17, 24, 39] } },
        { content: String(averages.target), styles: { halign: 'center', fontStyle: 'bold', textColor: [17, 24, 39] } },
        { content: String(averages.actualWorkDone), styles: { halign: 'center', fontStyle: 'bold', textColor: [22, 101, 52] } },
        { content: `${averages.workNotDone}%`, styles: { halign: 'center', fontStyle: 'bold', textColor: [17, 24, 39] } },
        { content: `${averages.workNotDoneOnTime}%`, styles: { halign: 'center', fontStyle: 'bold', textColor: [17, 24, 39] } },
        { content: String(averages.totalWorkDone), styles: { halign: 'center', fontStyle: 'bold', textColor: [55, 48, 163] } },
        { content: String(averages.weekPending), styles: { halign: 'center', fontStyle: 'bold', textColor: [17, 24, 39] } },
        { content: String(averages.allPendingTillDate), styles: { halign: 'center', fontStyle: 'bold', textColor: [17, 24, 39] } },
      ]
    ] : undefined;

    autoTable(doc, {
      head: head,
      body: body,
      foot: foot,
      startY: 32,
      margin: { top: 32, bottom: 16, left: 10, right: 10 },
      showHead: 'everyPage',
      showFoot: 'lastPage',
      theme: 'grid',
      styles: {
        fontSize: 8.5,
        cellPadding: 2,
        valign: 'middle',
        lineWidth: 0.1,
        lineColor: [229, 231, 235],
      },
      headStyles: {
        fillColor: [22, 85, 90], // #16555a
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 2.5,
      },
      footStyles: {
        fillColor: [243, 244, 246], // #f3f4f6
        textColor: [17, 24, 39],
        fontSize: 8.5,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 2.5,
      },
      didDrawPage: (data) => {
        // Draw Header Banner on every page
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(18, 70, 73); // #124649
        doc.text('MIS PASSARY', 10, 12);

        // Category Badge
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(36, 136, 143); // #24888f
        doc.roundedRect(52, 7.5, 52, 6, 1, 1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(categoryName.toUpperCase(), 78, 11.5, { align: 'center' });

        // Subtitle
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        doc.text('Performance & Commitment History Report', 10, 17);

        // Date Range Box (Top Right)
        doc.setFillColor(240, 253, 250); // #f0fdfa
        doc.setDrawColor(36, 136, 143);
        doc.roundedRect(pageWidth - 85, 6, 75, 13, 1.5, 1.5, 'FD');
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(22, 85, 90);
        doc.text('REPORT DATE RANGE', pageWidth - 47.5, 10, { align: 'center' });
        doc.setFontSize(9.5);
        doc.setTextColor(12, 47, 49);
        doc.text(dateRangeDisplay, pageWidth - 47.5, 16, { align: 'center' });

        // Meta info row
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        let metaText = `Total Records: ${records.length}`;
        if (activeFiltersText.length > 0) {
          metaText += `  |  Filters: ${activeFiltersText.join(' | ')}`;
        }
        doc.text(metaText, 10, 25);
        doc.text(`Generated: ${generatedTime}`, pageWidth - 10, 25, { align: 'right' });

        // Bottom Footer
        doc.setFontSize(7.5);
        doc.setTextColor(156, 163, 175);
        doc.text('MIS Passary System • History Performance Report', 10, pageHeight - 6);
        doc.text(`Page ${data.pageNumber}`, pageWidth - 10, pageHeight - 6, { align: 'right' });
      },
    });

    const safeCatName = categoryName.replace(/[^a-zA-Z0-9]/g, '_');
    const safeDate = `${startDate || 'Start'}_to_${endDate || 'End'}`.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`${safeCatName}_${safeDate}.pdf`);
  } catch (err) {
    console.error('Error generating History PDF:', err);
    alert('Failed to generate PDF. Please use the Print Report button as an alternative.');
  }
}
