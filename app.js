

// Logic for Standard GST Grid Purchase Order Template
document.addEventListener('DOMContentLoaded', () => {
    // Initial line item matching user reference image
    let lineItems = [
        { id: 1, pkgs: '', description: '3049 Mini Deepak Frills', hsn: '4817', quantity: 1000, rate: 10.50 }
    ];

    // Element references
    const itemsTableBody = document.getElementById('itemsTableBody');
    const previewItemsBody = document.getElementById('previewItemsBody');
    const btnAddRow = document.getElementById('btnAddRow');
    const btnGenRef = document.getElementById('btnGenRef');
    const btnSampleData = document.getElementById('btnSampleData');
    const btnReset = document.getElementById('btnReset');
    const btnDownloadPdf = document.getElementById('btnDownloadPdf');
    const btnPrint = document.getElementById('btnPrint');

    // Field mapping from input IDs to live preview IDs
    const fieldMap = {
        refNo: 'previewRefNo',
        poDate: 'previewPoDate',
        buyerOrderNo: 'previewBuyerOrderNo',
        buyerOrderDate: 'previewBuyerOrderDate',
        poSubject: 'previewPoSubject',
        supplierName: 'previewSupplierName',
        supplierAddress: 'previewSupplierAddress',
        supplierGstin: 'previewSupplierGstin',
        supplierMobile: 'previewSupplierMobile',
        companyName: 'previewCompanyName',
        companyAddress: 'previewCompanyAddressShort',
        companyGstin: 'previewCompanyGstin',
        companyEmail: 'previewCompanyEmail',
        amountWords: 'previewAmountWords',
        paymentTerms: 'previewPaymentTerms',
        otherRef: 'previewOtherRef',
        signatoryName: 'previewSignatoryName',
        signatoryTitle: 'previewSignatoryTitle'
    };

    function init() {
        if (!document.getElementById('poDate').value) {
            document.getElementById('poDate').value = new Date().toISOString().split('T')[0];
        }
        bindFormInputs();
        renderItems();
        updatePreview();
    }

    function generateRefNumber() {
        const year = '26-27';
        const num = String(Math.floor(1 + Math.random() * 99)).padStart(3, '0');
        document.getElementById('refNo').value = `PO/ME/${year}/${num}`;
        updatePreview();
    }

    function bindFormInputs() {
        const inputs = document.querySelectorAll('#poForm input, #poForm textarea');
        inputs.forEach(input => {
            input.addEventListener('input', updatePreview);
            input.addEventListener('change', updatePreview);
        });
    }

    // Render Edit & Preview items
    function renderItems() {
        itemsTableBody.innerHTML = '';
        previewItemsBody.innerHTML = '';

        let totalQty = 0;
        let totalAmount = 0;

        lineItems.forEach((item, index) => {
            totalQty += Number(item.quantity) || 0;
            const amount = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
            totalAmount += amount;

            // Form Edit Row
            const trEdit = document.createElement('tr');
            trEdit.innerHTML = `
                <td>
                    <input type="text" value="${escapeHtml(item.pkgs)}" placeholder="e.g. 5 Cartons" oninput="updateItem(${item.id}, 'pkgs', this.value)">
                </td>
                <td>
                    <input type="text" value="${escapeHtml(item.description)}" placeholder="Description of goods" oninput="updateItem(${item.id}, 'description', this.value)">
                </td>
                <td>
                    <input type="text" value="${escapeHtml(item.hsn)}" placeholder="4817" oninput="updateItem(${item.id}, 'hsn', this.value)">
                </td>
                <td>
                    <input type="number" min="0" value="${item.quantity}" oninput="updateItem(${item.id}, 'quantity', this.value)">
                </td>
                <td>
                    <input type="number" min="0" step="0.01" value="${item.rate}" oninput="updateItem(${item.id}, 'rate', this.value)">
                </td>
                <td>
                    <button type="button" class="btn btn-small btn-danger" onclick="deleteItem(${item.id})"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            itemsTableBody.appendChild(trEdit);

            // Preview Row matching reference image
            const trPreview = document.createElement('tr');
            trPreview.innerHTML = `
                <td class="text-center">${index + 1}</td>
                <td>${escapeHtml(item.pkgs || '')}</td>
                <td><strong>${escapeHtml(item.description || '')}</strong></td>
                <td class="text-center">${escapeHtml(item.hsn || '')}</td>
                <td class="text-center">${item.quantity || 0}</td>
            `;
            previewItemsBody.appendChild(trPreview);
        });

        // Add spacer row to ensure vertical borders stretch down in PDF (html2canvas fix)
        const trSpacer = document.createElement('tr');
        trSpacer.style.height = '100%';
        trSpacer.innerHTML = `
            <td style="border-bottom: none; border-top: none;"></td>
            <td style="border-bottom: none; border-top: none;"></td>
            <td style="border-bottom: none; border-top: none;"></td>
            <td style="border-bottom: none; border-top: none;"></td>
            <td style="border-bottom: none; border-top: none;"></td>
        `;
        previewItemsBody.appendChild(trSpacer);

        // Update Total Qty badge
        document.getElementById('previewTotalQty').textContent = totalQty;

        // Auto-calculate Amount in Words if totalAmount > 0 and field is empty or matching default
        if (totalAmount > 0) {
            const words = numberToWords(totalAmount);
            const currentWords = document.getElementById('amountWords').value;
            if (!currentWords || currentWords.includes('Ten Thousand Five Hundred')) {
                document.getElementById('amountWords').value = `${words} E.&O.E`;
                document.getElementById('previewAmountWords').textContent = `${words} E.&O.E`;
            }
        }
    }

    window.updateItem = function(id, key, val) {
        const item = lineItems.find(i => i.id === id);
        if (item) {
            item[key] = (key === 'quantity' || key === 'rate') ? (parseFloat(val) || 0) : val;
            renderItems();
        }
    };

    window.deleteItem = function(id) {
        if (lineItems.length <= 1) {
            alert('Purchase Order must contain at least one line item.');
            return;
        }
        lineItems = lineItems.filter(i => i.id !== id);
        renderItems();
    };

    btnAddRow.addEventListener('click', () => {
        lineItems.push({
            id: Date.now(),
            pkgs: '',
            description: '',
            hsn: '',
            quantity: 0,
            rate: 0
        });
        renderItems();
    });

    btnGenRef.addEventListener('click', generateRefNumber);

    function formatDateForPreview(val) {
        if (!val) return '-';
        // Check if value is YYYY-MM-DD from calendar input
        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
            const parts = val.split('-');
            const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
            const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
            const day = String(dateObj.getDate()).padStart(2, '0');
            const month = months[dateObj.getMonth()];
            const year = dateObj.getFullYear();
            return `${day}-${month}-${year}`;
        }
        return val;
    }

    function updatePreview() {
        for (const [inputId, previewId] of Object.entries(fieldMap)) {
            const inputElem = document.getElementById(inputId);
            const previewElem = document.getElementById(previewId);
            if (inputElem && previewElem) {
                if (inputId === 'poDate' || inputId === 'buyerOrderDate') {
                    previewElem.textContent = formatDateForPreview(inputElem.value);
                } else {
                    previewElem.textContent = inputElem.value || '-';
                }
            }
        }
        // Update handwritten signature script text
        const sigName = document.getElementById('signatoryName').value;
        const sigElem = document.getElementById('signatureScript');
        if (sigElem) {
            sigElem.textContent = sigName || 'Signature';
        }
    }

    // Company Logo Upload Handler
    const logoFileInput = document.getElementById('logoFile');
    const btnClearLogo = document.getElementById('btnClearLogo');
    const previewLogoContainer = document.getElementById('previewLogoContainer');
    const previewLogoImg = document.getElementById('previewLogoImg');

    if (logoFileInput) {
        logoFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    previewLogoImg.src = event.target.result;
                    previewLogoContainer.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (btnClearLogo) {
        btnClearLogo.addEventListener('click', () => {
            if (logoFileInput) logoFileInput.value = '';
            previewLogoImg.src = 'logo.png';
        });
    }

    // Signature File Upload Handler
    const signatureFileInput = document.getElementById('signatureFile');
    const btnClearSig = document.getElementById('btnClearSig');
    const previewSignatureImg = document.getElementById('previewSignatureImg');
    const previewSignatureText = document.getElementById('previewSignatureText');

    if (signatureFileInput) {
        signatureFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    previewSignatureImg.src = event.target.result;
                    previewSignatureImg.style.display = 'block';
                    previewSignatureText.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (btnClearSig) {
        btnClearSig.addEventListener('click', () => {
            if (signatureFileInput) signatureFileInput.value = '';
            previewSignatureImg.src = '';
            previewSignatureImg.style.display = 'none';
            previewSignatureText.style.display = 'block';
        });
    }

    // Template Selection Handler
    const templateSelect = document.getElementById('templateSelect');
    if (templateSelect) {
        templateSelect.addEventListener('change', function () {
            const selected = this.value;
            const poDoc = document.getElementById('poDocument');
            if (poDoc) {
                // Remove existing template classes
                poDoc.classList.remove('template-classic', 'template-modern', 'template-minimal');
                // Add the selected template class
                poDoc.classList.add(`template-${selected}`);
            }
        });
    }

    function numberToWords(num) {
        const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        num = Math.floor(num);
        if (num === 0) return 'Zero';
        if (num === 10500) return 'Ten Thousand Five Hundred';

        function inWords(n) {
            if ((n = n.toString()).length > 9) return 'overflow';
            let n_array = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
            if (!n_array) return '';
            let str = '';
            str += (n_array[1] != 0) ? (a[Number(n_array[1])] || b[n_array[1][0]] + ' ' + a[n_array[1][1]]) + 'Crore ' : '';
            str += (n_array[2] != 0) ? (a[Number(n_array[2])] || b[n_array[2][0]] + ' ' + a[n_array[2][1]]) + 'Lakh ' : '';
            str += (n_array[3] != 0) ? (a[Number(n_array[3])] || b[n_array[3][0]] + ' ' + a[n_array[3][1]]) + 'Thousand ' : '';
            str += (n_array[4] != 0) ? (a[Number(n_array[4])] || b[n_array[4][0]] + ' ' + a[n_array[4][1]]) + 'Hundred ' : '';
            str += (n_array[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n_array[5])] || b[n_array[5][0]] + ' ' + a[n_array[5][1]]) : '';
            return str.trim();
        }

        return inWords(num);
    }

    // Load exact sample data matching user reference PDF PO 4.pdf
    btnSampleData.addEventListener('click', () => {
        document.getElementById('refNo').value = 'PO/ME/26-27/014';
        document.getElementById('poDate').value = '2026-08-13';
        document.getElementById('buyerOrderNo').value = '';
        document.getElementById('buyerOrderDate').value = '';
        document.getElementById('poSubject').value = 'Order for Supply of Paper Jharokha';

        document.getElementById('supplierName').value = 'Mohini Enterprises';
        document.getElementById('supplierAddress').value = 'Shahpur- Mubarakpur - Ladawali, Kokarpur, Moradabad\n244504(U.P.)';
        document.getElementById('supplierGstin').value = '09ALGPP0253R1ZJ';
        document.getElementById('supplierMobile').value = '7078663938/8194073656';

        document.getElementById('companyName').value = 'HELP US GREEN LLP';
        document.getElementById('companyAddress').value = 'C-8/3SITE-1 Industrial Area Panki, Kanpur- 208022 Uttar Pradesh -India';
        document.getElementById('companyGstin').value = '09AAMFH5783P1ZC';
        document.getElementById('companyEmail').value = 'hello@helpusgreen.com';

        document.getElementById('amountWords').value = 'Ten Thousand Five Hundred E.&O.E';
        document.getElementById('paymentTerms').value = '';
        document.getElementById('otherRef').value = '';

        document.getElementById('signatoryName').value = 'Karan Rastogi';
        document.getElementById('signatoryTitle').value = 'Partner';

        lineItems = [
            { id: 1, pkgs: '', description: '3049 Mini Deepak Frills', hsn: '4817', quantity: 1000, rate: 10.50 }
        ];

        renderItems();
        updatePreview();
    });

    btnReset.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all fields?')) {
            document.getElementById('poForm').reset();
            lineItems = [
                { id: Date.now(), pkgs: '', description: '', hsn: '', quantity: 0, rate: 0 }
            ];
            renderItems();
            updatePreview();
        }
    });

    btnPrint.addEventListener('click', () => {
        window.print();
    });

    btnDownloadPdf.addEventListener('click', () => {
        const element = document.getElementById('poDocument');
        const refNo = (document.getElementById('refNo').value || 'PO').replace(/[\/\\:]/g, '_');

        // Configure direct PDF file download
        const opt = {
            margin: [0, 0, 0, 0],
            filename: `${refNo}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2, 
                useCORS: true, 
                logging: false,
                scrollY: 0
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        btnDownloadPdf.disabled = true;
        btnDownloadPdf.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating PDF...';

        html2pdf().set(opt).from(element).save().then(() => {
            btnDownloadPdf.disabled = false;
            btnDownloadPdf.innerHTML = '<i class="fa-solid fa-file-pdf"></i> Download PDF';
        }).catch(err => {
            console.error('PDF Generation error:', err);
            btnDownloadPdf.disabled = false;
            btnDownloadPdf.innerHTML = '<i class="fa-solid fa-file-pdf"></i> Download PDF';
            alert('PDF generation failed. Please check console.');
        });
    });

    const btnDownloadDoc = document.getElementById('btnDownloadDoc');

    btnDownloadDoc.addEventListener('click', () => {
        const refNo = (document.getElementById('refNo').value || 'PurchaseOrder').replace(/[\\/\\:]/g, '_');

        // Extract dynamic values for Word generation
        const supplierName = document.getElementById('previewSupplierName').innerText;
        const supplierAddr = document.getElementById('previewSupplierAddress').innerText;
        const supplierGstin = document.getElementById('previewSupplierGstin').innerText;
        const supplierMob = document.getElementById('previewSupplierMobile').innerText;

        const previewRef = document.getElementById('previewRefNo').innerText;
        const poDate = document.getElementById('previewPoDate').innerText;
        const buyerOrderNo = document.getElementById('previewBuyerOrderNo').innerText;
        const buyerOrderDate = document.getElementById('previewBuyerOrderDate').innerText;

        const subject = document.getElementById('previewPoSubject').innerText;
        const amountWords = document.getElementById('previewAmountWords').innerText;
        const paymentTerms = document.getElementById('previewPaymentTerms').innerText;
        const otherRef = document.getElementById('previewOtherRef').innerText;

        const companyName = document.getElementById('previewCompanyName').innerText;
        const companyAddr = document.getElementById('previewCompanyAddressShort').innerText;
        const companyGstin = document.getElementById('previewCompanyGstin').innerText;
        const companyEmail = document.getElementById('previewCompanyEmail').innerText;

        const sigName = document.getElementById('previewSignatoryName').innerText;
        const sigTitle = document.getElementById('previewSignatoryTitle').innerText;

        // Build the items rows for the Word document using the actual lineItems data
        let itemsRows = '';
        lineItems.forEach((item, idx) => {
            const pkgs = escapeHtml(item.pkgs || '');
            const desc = escapeHtml(item.description || '');
            const hsn = escapeHtml(item.hsn || '');
            const qty = item.quantity || 0;
            itemsRows += `
<tr>
    <td class="text-center">${idx + 1}</td>
    <td>${pkgs}</td>
    <td><strong>${desc}</strong></td>
    <td class="text-center">${hsn}</td>
    <td class="text-center">${qty}</td>
</tr>`;
        });
        // Calculate total quantity (recomputed for safety)
        const totalQty = lineItems.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);

        // Build MS Word compatible HTML
        const wordDocHtml = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                  xmlns:w='urn:schemas-microsoft-com:office:word' 
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <!--[if gte mso 9]>
                <xml>
                    <w:WordDocument>
                        <w:View>Print</w:View>
                        <w:Zoom>100</w:Zoom>
                        <w:DoNotOptimizeForBrowser/>
                    </w:WordDocument>
                </xml>
                <![endif]-->
                <style>
                    @page { size: A4 portrait; margin: 15mm 15mm 15mm 15mm; }
                    body { font-family: 'Times New Roman', serif; font-size: 11pt; color: #000; margin: 0; padding: 0; }
                    table.main-gst-table { width: 100%; border-collapse: collapse; border: 2pt solid #000; }
                    table.main-gst-table > tbody > tr > td { border: 1pt solid #000; padding: 0; vertical-align: top; }
                    table.header-table { width: 100%; border-collapse: collapse; border: none; }
                    table.header-table td { border: 1pt solid #000; padding: 6pt; vertical-align: top; }
                    .title-bold { font-weight: bold; font-size: 12pt; }
                    .text-sm { font-size: 10pt; }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    table.goods-table { width: 100%; border-collapse: collapse; border: none; }
                    table.goods-table th { border-bottom: 1pt solid #000; border-right: 1pt solid #000; padding: 5pt; font-size: 10pt; font-weight: bold; text-align: center; background-color: #f8fafc; }
                    table.goods-table td { border-right: 1pt solid #000; padding: 5pt; font-size: 10.5pt; vertical-align: top; }
                    table.goods-table th:last-child, table.goods-table td:last-child { border-right: none; }
                    table.goods-table tfoot td { border-top: 1pt solid #000; border-bottom: 1pt solid #000; padding: 5pt; font-weight: bold; }
                </style>
            </head>
            <body>
                <div style="text-align: center; margin-bottom: 8pt;">
                    <h1 style="font-size: 16pt; font-weight: bold; text-decoration: underline; margin: 0; padding: 0;">PURCHASE ORDER</h1>
                </div>
                <table class="main-gst-table">
                    <tr>
                        <td style="width: 55%; padding: 6pt; border-right: 1pt solid #000;">
                            <div class="text-sm">Supplier (Bill from)</div>
                            <div class="title-bold">${supplierName}</div>
                            <div class="text-sm">${supplierAddr.replace(/\n/g, '<br>')}</div>
                            <div style="font-weight: bold; margin-top: 4pt;">GSTIN : ${supplierGstin}</div>
                            <div style="font-weight: bold;">Mob: ${supplierMob}</div>
                        </td>
                        <td style="width: 45%; padding: 0;">
                            <table class="header-table">
                                <tr>
                                    <td style="width: 50%;"><div class="text-sm">Ref:</div><div style="font-weight: bold;">${previewRef}</div></td>
                                    <td style="width: 50%;"><div class="text-sm">Dated:</div><div style="font-weight: bold;">${poDate}</div></td>
                                </tr>
                                <tr>
                                    <td><div class="text-sm">Buyer's Order No.</div><div style="font-weight: bold;">${buyerOrderNo}</div></td>
                                    <td><div class="text-sm">Dated</div><div style="font-weight: bold;">${buyerOrderDate}</div></td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="2" style="padding: 6pt; border-top: 1pt solid #000; border-bottom: 1pt solid #000;">
                            <strong>Subject:</strong> ${subject}
                        </td>
                    </tr>
                    <tr>
                        <td colspan="2" style="padding: 0; min-height: 300pt; vertical-align: top;">
                            <table class="goods-table">
                                <thead>
                                    <tr>
                                        <th style="width: 8%;">Sl. No.</th>
                                        <th style="width: 20%;">No. &amp;Kind of Pkgs.</th>
                                        <th style="width: 44%;">Description of Goods</th>
                                        <th style="width: 14%;">HSN/SAC</th>
                                        <th style="width: 14%;">Quantity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsRows}
                                    <tr style="height: 250pt;"><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td class="text-center"><strong>0</strong></td>
                                        <td></td>
                                        <td class="text-right"><strong>Total</strong></td>
                                        <td></td>
                                        <td class="text-center"><strong>${totalQty}</strong></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="2" style="padding: 6pt; border-top: 1pt solid #000; border-bottom: 1pt solid #000;">
                            <table style="width: 100%; border: none;">
                                <tr>
                                    <td style="border: none; padding: 0; font-weight: bold; width: 40%;">Amount Chargeable (in words)</td>
                                    <td style="border: none; padding: 0; font-weight: bold; text-align: right; font-style: italic;">${amountWords}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="2" style="padding: 6pt; border-bottom: 1pt solid #000;">
                            <div><strong>Mode/Terms of Payment :</strong> ${paymentTerms}</div>
                            <div style="margin-top: 4pt;"><strong>Other References:</strong> ${otherRef}</div>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="2" style="padding: 8pt;">
                            <table style="width: 100%; border: none;">
                                <tr>
                                    <td style="width: 58%; border: none; padding: 0; vertical-align: top;">
                                        <div style="font-weight: bold;">For ${companyName} ${companyAddr}</div>
                                        <div style="margin-top: 4pt;">Company's GSTIN/UIN: <strong>${companyGstin}</strong></div>
                                        <div>E-Mail: ${companyEmail}</div>
                                    </td>
                                    <td style="width: 38%; border: none; padding: 0; text-align: center; vertical-align: top;">
                                        <div style="font-weight: bold; font-size: 10pt;">Authorised Signatory</div>
                                        <div style="margin-top: 4pt;">[${sigName}]</div>
                                        <div>[${sigTitle}]</div>
                                        <div style="font-family: 'Caveat', cursive; font-size: 18pt; color: #1e3a8a; margin-top: 8pt;">${sigName}</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;
        const blob = new Blob(['\ufeff', wordDocHtml], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${refNo}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    function escapeHtml(str) {
        return (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    init();
});
