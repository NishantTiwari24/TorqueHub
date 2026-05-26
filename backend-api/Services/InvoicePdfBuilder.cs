using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using WeatherAPI.DTOs.PurchaseInvoice;
using WeatherAPI.DTOs.SalesInvoice;

namespace WeatherAPI.Services
{
    public static class InvoicePdfBuilder
    {
        static InvoicePdfBuilder()
        {
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public static byte[] BuildPurchaseInvoicePdf(PurchaseInvoiceSummaryDto invoice)
        {
            var previewImageBytes = TryLoadFirstPartImage(invoice.Items.Select(x => x.ImageUrl));

            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(28);
                    page.DefaultTextStyle(x => x.FontSize(11));

                    page.Header().Element(c => BuildHeader(c, "PURCHASE INVOICE", invoice.InvoiceNumber));

                    page.Content().Column(col =>
                    {
                        col.Spacing(14);

                        col.Item().Element(c => BuildMetaCard(
                            c,
                            "Vendor",
                            invoice.VendorName,
                            invoice.InvoiceDate,
                            invoice.InvoiceNumber,
                            invoice.Notes));

                        if (previewImageBytes is not null)
                        {
                            col.Item().Element(c => BuildImageCard(c, previewImageBytes));
                        }

                        col.Item().Element(c => BuildItemsTable(c, invoice.Items.Select(i => new InvoiceLine
                        {
                            PartName = i.PartName,
                            Quantity = i.Quantity,
                            UnitCost = i.UnitCost,
                            LineTotal = i.LineTotal,
                            Condition = "-"
                        }).ToList()));

                        col.Item().AlignRight().Element(c => BuildTotals(c, invoice.TotalAmount));
                    });

                    page.Footer().AlignCenter().Text($"Generated At: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC").FontSize(9).FontColor(Colors.Grey.Darken1);
                });
            }).GeneratePdf();
        }

        public static byte[] BuildSalesInvoicePdf(SalesInvoiceSummaryDto invoice)
        {
            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(28);
                    page.DefaultTextStyle(x => x.FontSize(11));

                    page.Header().Element(c => BuildHeader(c, "SALES INVOICE", invoice.InvoiceNumber));

                    page.Content().Column(col =>
                    {
                        col.Spacing(14);

                        col.Item().Element(c => BuildMetaCard(
                            c,
                            "Customer",
                            invoice.CustomerName,
                            invoice.SaleDate,
                            invoice.InvoiceNumber,
                            $"Served by: {invoice.StaffName}"));

                        col.Item().Element(c => BuildItemsTable(c, invoice.Items.Select(i => new InvoiceLine
                        {
                            PartName = i.PartName,
                            Quantity = i.Quantity,
                            UnitCost = i.UnitPrice,
                            LineTotal = i.LineTotal,
                            Condition = "-"
                        }).ToList(), "Unit Price"));

                        col.Item().AlignRight().Element(c => BuildSalesTotals(c, invoice.Subtotal, invoice.Discount, invoice.FinalTotal, invoice.PaidAmount, invoice.CreditAmount));
                    });

                    page.Footer().AlignCenter().Text($"Generated At: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC").FontSize(9).FontColor(Colors.Grey.Darken1);
                });
            }).GeneratePdf();
        }

        public static byte[] BuildOpeningStockInvoicePdf(
            string invoiceNumber,
            string vendorName,
            string partName,
            int quantity,
            string condition,
            decimal unitCost,
            string? previewImageUrl = null)
        {
            var total = quantity * unitCost;
            var previewImageBytes = TryLoadFirstPartImage(new[] { previewImageUrl ?? string.Empty });

            var lineItems = new List<InvoiceLine>
            {
                new()
                {
                    PartName = partName,
                    Quantity = quantity,
                    UnitCost = unitCost,
                    LineTotal = total,
                    Condition = condition
                }
            };

            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(28);
                    page.DefaultTextStyle(x => x.FontSize(11));

                    page.Header().Element(c => BuildHeader(c, "OPENING STOCK INVOICE", invoiceNumber));

                    page.Content().Column(col =>
                    {
                        col.Spacing(14);

                        col.Item().Element(c => BuildMetaCard(
                            c,
                            "Vendor",
                            vendorName,
                            DateTime.UtcNow.Date,
                            invoiceNumber,
                            "Opening stock recorded during part creation."));

                        if (previewImageBytes is not null)
                        {
                            col.Item().Element(c => BuildImageCard(c, previewImageBytes));
                        }

                        col.Item().Element(c => BuildItemsTable(c, lineItems));
                        col.Item().AlignRight().Element(c => BuildTotals(c, total));
                    });

                    page.Footer().AlignCenter().Text($"Generated At: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC").FontSize(9).FontColor(Colors.Grey.Darken1);
                });
            }).GeneratePdf();
        }

        private static void BuildHeader(IContainer container, string title, string invoiceNumber)
        {
            container.Background("#0f172a").Padding(16).Row(row =>
            {
                row.RelativeItem().Column(col =>
                {
                    col.Item().Text("TORQUEHUB AUTO PARTS").FontColor(Colors.White).FontSize(18).SemiBold();
                    col.Item().Text("Reliable Parts. Reliable Service.").FontColor("#cbd5e1").FontSize(10);
                });

                row.ConstantItem(190).AlignRight().Column(col =>
                {
                    col.Item().Text(title).FontColor(Colors.White).SemiBold().FontSize(12);
                    col.Item().Text(invoiceNumber).FontColor("#cbd5e1").FontSize(10);
                });
            });
        }

        private static void BuildMetaCard(IContainer container, string partyLabel, string partyName, DateTime invoiceDate, string invoiceNumber, string? notes)
        {
            container
                .Border(1)
                .BorderColor("#cbd5e1")
                .Background("#f8fafc")
                .Padding(12)
                .Column(col =>
                {
                    col.Spacing(5);
                    col.Item().Text($"{partyLabel}: {partyName}");
                    col.Item().Text($"Invoice Number: {invoiceNumber}");
                    col.Item().Text($"Invoice Date: {invoiceDate:yyyy-MM-dd}");
                    if (!string.IsNullOrWhiteSpace(notes))
                    {
                        col.Item().Text($"Notes: {TrimToLength(notes, 160)}").FontColor("#334155");
                    }
                });
        }

        private static void BuildImageCard(IContainer container, byte[] imageBytes)
        {
            container
                .Border(1)
                .BorderColor("#cbd5e1")
                .Padding(10)
                .Column(col =>
                {
                    col.Item().Text("Part Preview").SemiBold();
                    col.Item().PaddingTop(8).Height(170).AlignLeft().Image(imageBytes).FitArea();
                });
        }

        private static void BuildItemsTable(IContainer container, IReadOnlyList<InvoiceLine> items, string unitLabel = "Unit Cost")
        {
            container.Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(3);
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(1.4f);
                    columns.RelativeColumn(1.5f);
                    columns.RelativeColumn(1.8f);
                });

                table.Header(header =>
                {
                    static IContainer HeaderCell(IContainer c) => c.Background("#e2e8f0").PaddingVertical(8).PaddingHorizontal(8);

                    header.Cell().Element(HeaderCell).Text("Part").SemiBold();
                    header.Cell().Element(HeaderCell).AlignRight().Text("Qty").SemiBold();
                    header.Cell().Element(HeaderCell).AlignCenter().Text("Condition").SemiBold();
                    header.Cell().Element(HeaderCell).AlignRight().Text(unitLabel).SemiBold();
                    header.Cell().Element(HeaderCell).AlignRight().Text("Line Total").SemiBold();
                });

                foreach (var item in items)
                {
                    static IContainer Cell(IContainer c) => c.BorderBottom(1).BorderColor("#e2e8f0").PaddingVertical(7).PaddingHorizontal(8);

                    table.Cell().Element(Cell).Text(TrimToLength(item.PartName, 48));
                    table.Cell().Element(Cell).AlignRight().Text(item.Quantity.ToString());
                    table.Cell().Element(Cell).AlignCenter().Text(item.Condition);
                    table.Cell().Element(Cell).AlignRight().Text($"Rs. {item.UnitCost:F2}");
                    table.Cell().Element(Cell).AlignRight().Text($"Rs. {item.LineTotal:F2}");
                }
            });
        }

        private static void BuildTotals(IContainer container, decimal total)
        {
            container.Width(220).Border(1).BorderColor("#cbd5e1").Padding(10).Column(col =>
            {
                col.Spacing(4);
                col.Item().Row(r =>
                {
                    r.RelativeItem().Text("Subtotal");
                    r.ConstantItem(100).AlignRight().Text($"Rs. {total:F2}");
                });
                col.Item().LineHorizontal(1).LineColor("#e2e8f0");
                col.Item().Row(r =>
                {
                    r.RelativeItem().Text("Grand Total").SemiBold();
                    r.ConstantItem(100).AlignRight().Text($"Rs. {total:F2}").SemiBold();
                });
            });
        }

        private static void BuildSalesTotals(IContainer container, decimal subtotal, decimal discount, decimal finalTotal, decimal paidAmount, decimal creditAmount)
        {
            container.Width(250).Border(1).BorderColor("#cbd5e1").Padding(10).Column(col =>
            {
                col.Spacing(4);
                col.Item().Row(r =>
                {
                    r.RelativeItem().Text("Subtotal");
                    r.ConstantItem(100).AlignRight().Text($"Rs. {subtotal:F2}");
                });
                col.Item().Row(r =>
                {
                    r.RelativeItem().Text("Discount");
                    r.ConstantItem(100).AlignRight().Text($"Rs. {discount:F2}");
                });
                col.Item().LineHorizontal(1).LineColor("#e2e8f0");
                col.Item().Row(r =>
                {
                    r.RelativeItem().Text("Grand Total").SemiBold();
                    r.ConstantItem(100).AlignRight().Text($"Rs. {finalTotal:F2}").SemiBold();
                });
                col.Item().Row(r =>
                {
                    r.RelativeItem().Text("Paid Amount");
                    r.ConstantItem(100).AlignRight().Text($"Rs. {paidAmount:F2}");
                });
                col.Item().Row(r =>
                {
                    r.RelativeItem().Text("Credit Amount").SemiBold();
                    r.ConstantItem(100).AlignRight().Text($"Rs. {creditAmount:F2}").SemiBold();
                });
            });
        }

        private static byte[]? TryLoadFirstPartImage(IEnumerable<string> imageUrls)
        {
            foreach (var imageUrl in imageUrls)
            {
                if (string.IsNullOrWhiteSpace(imageUrl))
                {
                    continue;
                }

                var localPath = ResolveLocalPartImagePath(imageUrl);
                if (string.IsNullOrWhiteSpace(localPath))
                {
                    continue;
                }

                try
                {
                    if (File.Exists(localPath))
                    {
                        return File.ReadAllBytes(localPath);
                    }
                }
                catch
                {
                    // Keep PDF generation resilient even if image loading fails.
                }
            }

            return null;
        }

        private static string? ResolveLocalPartImagePath(string imageUrl)
        {
            string relativePath;

            if (Uri.TryCreate(imageUrl, UriKind.Absolute, out var absoluteUri))
            {
                relativePath = Uri.UnescapeDataString(absoluteUri.AbsolutePath);
            }
            else
            {
                relativePath = imageUrl;
            }

            relativePath = relativePath.Replace("\\", "/");
            if (!relativePath.StartsWith("/uploads/parts/", StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            var fileName = Path.GetFileName(relativePath);
            if (string.IsNullOrWhiteSpace(fileName))
            {
                return null;
            }

            var baseDir = Directory.GetCurrentDirectory();
            return Path.Combine(baseDir, "wwwroot", "uploads", "parts", fileName);
        }

        private static string TrimToLength(string text, int maxLength)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return string.Empty;
            }

            var cleaned = text.Trim();
            return cleaned.Length <= maxLength ? cleaned : $"{cleaned[..Math.Max(0, maxLength - 3)]}...";
        }

        private sealed class InvoiceLine
        {
            public string PartName { get; set; } = string.Empty;
            public int Quantity { get; set; }
            public string Condition { get; set; } = "New";
            public decimal UnitCost { get; set; }
            public decimal LineTotal { get; set; }
        }
    }
}
