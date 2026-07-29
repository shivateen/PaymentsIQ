/* ==========================================================================
   PaymentsIQ — synthetic demo data
   Client-neutral. Context: a US consumer-packaged-goods / retail organisation
   validating supplier payment claims (freight, co-pack, packaging, trade
   programs) before the weekly payment run. All currency is USD.
   Every organisation, vendor and reference below is fictional.
   ========================================================================== */

const DATA = (() => {
  /* ---------- Verdicts ---------- */
  const VERDICT = {
    HIGH_ABERRATION: { key: 'HIGH_ABERRATION', label: 'High aberration', short: 'High aberration', tone: 'error',   blurb: 'Material variance against contract — hold for senior review' },
    MODERATE_FLAG:   { key: 'MODERATE_FLAG',   label: 'Moderate flag',   short: 'Moderate flag',   tone: 'warning', blurb: 'One or more line items outside benchmark — review recommended' },
    AWAITING_VENDOR: { key: 'AWAITING_VENDOR', label: 'Awaiting vendor', short: 'Awaiting vendor', tone: 'neutral', blurb: 'Query issued to the vendor — response outstanding' },
    VALIDATED:       { key: 'VALIDATED',       label: 'Validated',       short: 'Validated',       tone: 'success', blurb: 'All automated checks passed — ready for sign-off' },
    AUTO_APPROVE:    { key: 'AUTO_APPROVE',    label: 'Auto-approve',    short: 'Auto-approve',    tone: 'success', blurb: 'Below delegation threshold with a clean check run' }
  };

  /* ---------- Approval matrix (USD) ---------- */
  const THRESHOLDS = {
    autoApprove: 250000,     // below this, straight-through
    analyst: 1000000,        // Senior Finance Analyst
    vpFinance: 4000000,      // VP Finance
    seniorSignOff: 4000000   // above this, CFO sign-off
  };

  function approverFor(amount) {
    if (amount < THRESHOLDS.autoApprove) return 'Straight-through (below delegation threshold)';
    if (amount < THRESHOLDS.analyst) return 'Senior Finance Analyst';
    if (amount < THRESHOLDS.vpFinance) return 'VP Finance';
    return 'Chief Financial Officer';
  }

  /* ---------- Benchmark norms (Settings → maintained by Finance) ---------- */
  const BENCHMARKS = [
    { id: 1,  parameter: 'Dry Van Linehaul — Regional',   min: 2.10,   max: 2.45,   unit: 'USD / mile',           category: 'Logistics',  updatedBy: 'System',        updatedAt: '02 Jul 2026', source: 'Contracted lane rates + national dry van index' },
    { id: 2,  parameter: 'Fuel Surcharge',                min: 0.28,   max: 0.38,   unit: 'USD / mile',           category: 'Logistics',  updatedBy: 'R. Okafor',     updatedAt: '11 Jul 2026', source: 'National diesel average, indexed weekly' },
    { id: 3,  parameter: 'Detention & Accessorials',      min: 55.00,  max: 68.00,  unit: 'USD / hour',           category: 'Logistics',  updatedBy: 'System',        updatedAt: '02 Jul 2026', source: 'Carrier master service agreements' },
    { id: 4,  parameter: 'Pallet In / Out Handling',      min: 4.50,   max: 6.25,   unit: 'USD / pallet',         category: 'Warehousing',updatedBy: 'System',        updatedAt: '02 Jul 2026', source: '3PL rate cards, 9 comparable networks' },
    { id: 5,  parameter: 'Ambient Storage',               min: 14.00,  max: 19.00,  unit: 'USD / pallet / month', category: 'Warehousing',updatedBy: 'System',        updatedAt: '02 Jul 2026', source: '3PL rate cards, 9 comparable networks' },
    { id: 6,  parameter: 'Corrugate Carton (32 ECT)',     min: 480.00, max: 540.00, unit: 'USD / 1,000 units',    category: 'Packaging',  updatedBy: 'M. Delgado',    updatedAt: '09 Jul 2026', source: 'Containerboard index + converter quotes' },
    { id: 7,  parameter: 'PET Resin',                     min: 0.62,   max: 0.71,   unit: 'USD / lb',             category: 'Packaging',  updatedBy: 'System',        updatedAt: '02 Jul 2026', source: 'Resin spot index, 12-week trailing' },
    { id: 8,  parameter: 'Shrink Film',                   min: 1.35,   max: 1.60,   unit: 'USD / lb',             category: 'Packaging',  updatedBy: 'System',        updatedAt: '02 Jul 2026', source: 'Converter quotes, 6 suppliers' },
    { id: 9,  parameter: 'Co-Pack Line Labor',            min: 22.00,  max: 28.00,  unit: 'USD / hour',           category: 'Co-Manufacturing', updatedBy: 'System',  updatedAt: '02 Jul 2026', source: 'Regional co-packer benchmark, 14 sites' },
    { id: 10, parameter: 'Changeover / Line Set-up',      min: 620.00, max: 780.00, unit: 'USD / changeover',     category: 'Co-Manufacturing', updatedBy: 'System',  updatedAt: '02 Jul 2026', source: 'Regional co-packer benchmark, 14 sites' },
    { id: 11, parameter: 'Floor Display Fabrication',     min: 38.00,  max: 46.00,  unit: 'USD / unit',           category: 'Trade',      updatedBy: 'System',        updatedAt: '02 Jul 2026', source: 'Display vendor quotes, 8 suppliers' },
    { id: 12, parameter: 'Retail Merchandising Visit',    min: 28.00,  max: 34.00,  unit: 'USD / store visit',    category: 'Trade',      updatedBy: 'A. Whitfield',  updatedAt: '14 Jul 2026', source: 'Field service agency rate cards' },
    { id: 13, parameter: 'Co-op Advertising Allowance',   min: 3.00,   max: 5.00,   unit: '% of net sales',       category: 'Trade',      updatedBy: 'System',        updatedAt: '02 Jul 2026', source: 'Trade terms library, all banners' },
    { id: 14, parameter: 'Vendor Admin / Overhead',       min: 8.00,   max: 12.00,  unit: '% of claim value',     category: 'Cross-category', updatedBy: 'System',    updatedAt: '02 Jul 2026', source: 'Contracted overhead caps' }
  ];

  /* ---------- Source systems the agents read from ---------- */
  const SYSTEMS = [
    { name: 'ERP — Finance',        detail: 'Purchase orders, GR/IR, payment history', status: 'connected' },
    { name: 'P2P — Invoicing',      detail: 'Vendor invoices and claim submissions',   status: 'connected' },
    { name: 'TMS — Transportation', detail: 'Shipment manifests, miles, accessorials', status: 'connected' },
    { name: 'Contract Repository',  detail: 'MSAs, rate schedules, amendments',        status: 'connected' },
    { name: 'Trade Promotion Mgmt', detail: 'Program budgets, deal terms, accruals',   status: 'connected' },
    { name: 'Data Warehouse',       detail: 'Historic claims, benchmark comparables',  status: 'connected' },
    { name: 'Vendor Portal / Email',detail: 'Queries and vendor correspondence',       status: 'connected' }
  ];

  const AGENTS = [
    { name: 'Retrieval Agent',     detail: 'Pulls the claim, PO, contract schedule and prior payment history' },
    { name: 'Validation Agent',    detail: 'Runs the 12-point check suite and benchmarks every line item' },
    { name: 'Communication Agent', detail: 'Drafts vendor queries and routes approvals to the right delegate' }
  ];

  /* ---------- Standard 12-point check suite ---------- */
  const CHECK_TEMPLATE = [
    { id: 1,  name: 'Duplicate Claim Check',              system: 'P2P — Invoicing' },
    { id: 2,  name: 'Vendor Registration Check',          system: 'ERP — Finance' },
    { id: 3,  name: 'PO Existence Check',                 system: 'ERP — Finance' },
    { id: 4,  name: 'PO Value / Cumulative Draw Check',   system: 'ERP — Finance' },
    { id: 5,  name: 'Contract Rate Check',                system: 'Contract Repository' },
    { id: 6,  name: 'Quantity / Volume Benchmark Check',  system: 'Data Warehouse' },
    { id: 7,  name: 'Delivery Confirmation Check',        system: 'TMS — Transportation' },
    { id: 8,  name: 'Change Order / Amendment Check',     system: 'Contract Repository' },
    { id: 9,  name: 'Retention / Holdback Check',         system: 'ERP — Finance' },
    { id: 10, name: 'Sales Tax Calculation Check',        system: 'ERP — Finance' },
    { id: 11, name: 'Payment Terms Check',                system: 'ERP — Finance' },
    { id: 12, name: 'Prior Rejection Check',              system: 'Data Warehouse' }
  ];

  /* ==========================================================================
     The claim queue — 10 claims, $28.00M
     ========================================================================== */
  const CLAIMS = [
    /* -------------------------------------------------- 1. HIGH ABERRATION */
    {
      id: 'SPC-NLG-4471',
      vendor: 'Northline Logistics',
      program: 'Midwest DC Freight Program',
      category: 'Logistics',
      period: 'Jun 2026 — Period 6',
      amount: 6420000,
      submitted: '20 Jul',
      verdict: 'HIGH_ABERRATION',
      status: 'pending',
      headline: 'Linehaul rate +28.8% over contract. No signed amendment on file.',
      exposure: 951400,
      lineItems: [
        { item: 'Dry Van Linehaul — Regional', unit: 'mile',       qty: 1420000, rate: 2.68,  amount: 3805600, benchmark: 'Contract $2.08 / mile (MSA-NL-014 Sch. B)', variance: 28.8, flag: 'HIGH' },
        { item: 'Fuel Surcharge',              unit: 'mile',       qty: 1420000, rate: 0.41,  amount: 582200,  benchmark: 'Index-linked, $0.34 / mile for period',     variance: 20.6, flag: 'MODERATE' },
        { item: 'Detention & Accessorials',    unit: 'hour',       qty: 9400,    rate: 62.00, amount: 582800,  benchmark: '$55.00 – $68.00 / hour',                    variance: 0,    flag: 'NORMAL' },
        { item: 'Pallet In / Out Handling',    unit: 'pallet',     qty: 128500,  rate: 5.90,  amount: 758150,  benchmark: '$4.50 – $6.25 / pallet',                    variance: 0,    flag: 'NORMAL' },
        { item: 'Vendor Admin / Overhead',     unit: '% of claim', qty: null,    rate: 9.8,   amount: 691250,  benchmark: '8.0% – 12.0% of claim value',               variance: 0,    flag: 'NORMAL' }
      ],
      aberrations: [
        'Dry Van Linehaul billed at $2.68 / mile against a contracted $2.08 / mile (MSA-NL-014, Schedule B). Variance +28.8%, worth $852,000 on this claim alone. No signed rate amendment exists in the contract repository.',
        'Fuel surcharge billed as a flat $0.41 / mile. The MSA ties surcharge to the national diesel average, which implies $0.34 / mile across the claim period — an overbilling of $99,400.',
        'Detention hours (9,400) sit 41% above the trailing six-period average for the same lane set at comparable shipped volume. Supporting driver logs were not attached.',
        'Northline Logistics has a repeat pattern: two prior periods carried linehaul over-claims of +11% and +16%, both settled by credit note rather than corrected at source.'
      ],
      recommendation: 'Withhold $951,400 pending a signed rate amendment and driver-log substantiation. Release the balance of $5,468,600 so the vendor is not blocked on undisputed volume.',
      comparables: [
        { id: 'SPC-CRW-4102', vendor: 'Crestwood Freight Systems', date: 'May 2026', value: 5910000, scope: 'Midwest DC network — 1.38M miles', rate: 2.14 },
        { id: 'SPC-NLG-4388', vendor: 'Northline Logistics',       date: 'May 2026', value: 6040000, scope: 'Midwest DC network — 1.41M miles', rate: 2.31 },
        { id: 'SPC-HBV-4055', vendor: 'Harborview 3PL',            date: 'Apr 2026', value: 4820000, scope: 'Great Lakes lanes — 1.12M miles',  rate: 2.19 },
        { id: 'SPC-CRW-3980', vendor: 'Crestwood Freight Systems', date: 'Apr 2026', value: 5330000, scope: 'Midwest DC network — 1.29M miles', rate: 2.11 }
      ],
      benchmarkNote: 'Benchmark source: 22 comparable regional dry-van programs (2023–2026) in the claims data warehouse.',
      checkOverrides: {
        5: { result: 'FLAGGED', detail: 'Dry Van Linehaul: contract $2.08 / mile vs claimed $2.68 / mile. Variance +28.8%.' },
        6: { result: 'FLAGGED', detail: 'Detention 9,400 hrs vs 6,660 hrs trailing average at comparable volume. Variance +41%.' },
        8: { result: 'FLAGGED', detail: 'No executed rate amendment found for MSA-NL-014 covering the claim period.' }
      },
      po: {
        ref: 'PO-LOG-2026-0341',
        description: 'Regional outbound freight — Midwest DC network, FY26',
        vendorLegal: 'Northline Logistics LLC',
        totalValue: 42000000,
        approvedDate: '14 Jan 2026',
        approvedBy: 'VP Finance',
        status: 'Active',
        paidToDate: 22300000,
        thisClaim: 6420000,
        terms: 'Net 45 from certification',
        holdback: 0.05,
        history: [
          { ref: 'SPC-NLG-4102', period: 'Mar 2026', claimed: 5330000, approved: 5330000, paid: '18 Apr 2026', status: 'Paid' },
          { ref: 'SPC-NLG-4255', period: 'Apr 2026', claimed: 6180000, approved: 5720000, paid: '16 May 2026', status: 'Part-certified' },
          { ref: 'SPC-NLG-4388', period: 'May 2026', claimed: 6040000, approved: 6040000, paid: '19 Jun 2026', status: 'Paid' }
        ]
      },
      documents: [
        { name: 'SPC-NLG-4471 Claim Pack.pdf',            size: '2.4 MB', state: 'Extracted' },
        { name: 'MSA-NL-014 Schedule B — Rates.pdf',      size: '860 KB', state: 'Extracted' },
        { name: 'TMS Shipment Manifest — Jun 2026.csv',   size: '4.1 MB', state: 'Extracted' },
        { name: 'PO-LOG-2026-0341 Approval.pdf',          size: '420 KB', state: 'Extracted' }
      ],
      correspondence: null
    },

    /* -------------------------------------------------- 2. MODERATE FLAG */
    {
      id: 'SPC-APX-3312',
      vendor: 'Apex Co-Packing',
      program: 'Plant 12 Seasonal Co-Pack',
      category: 'Co-Manufacturing',
      period: 'Jun 2026 — Period 6',
      amount: 4310000,
      submitted: '21 Jul',
      verdict: 'MODERATE_FLAG',
      status: 'pending',
      headline: 'Admin fee above contracted cap. Changeover schedule not attached.',
      exposure: 214300,
      lineItems: [
        { item: 'Co-Pack Line Labor',       unit: 'hour',       qty: 96400,  rate: 27.10,  amount: 2612440, benchmark: '$22.00 – $28.00 / hour',        variance: 0,    flag: 'NORMAL' },
        { item: 'Changeover / Line Set-up', unit: 'changeover', qty: 890,    rate: 812.00, amount: 722680,  benchmark: '$620 – $780 / changeover',      variance: 4.1,  flag: 'MODERATE' },
        { item: 'Shrink Film',              unit: 'lb',         qty: 214000, rate: 1.52,   amount: 325280,  benchmark: '$1.35 – $1.60 / lb',            variance: 0,    flag: 'NORMAL' },
        { item: 'Quality Hold & Rework',    unit: 'hour',       qty: 3120,   rate: 26.50,  amount: 82680,   benchmark: '$22.00 – $28.00 / hour',        variance: 0,    flag: 'NORMAL' },
        { item: 'Vendor Admin / Overhead',  unit: '% of claim', qty: null,   rate: 13.4,   amount: 566920,  benchmark: '8.0% – 12.0% of claim value',   variance: 11.7, flag: 'MODERATE' }
      ],
      aberrations: [
        'Vendor admin / overhead recovered at 13.4% of claim value against a contracted cap of 12.0%. Excess recovery $59,300 on this claim; the same 13.4% rate appears on the two preceding periods.',
        'Changeover charged at $812 per event, 4.1% above the benchmark ceiling of $780. 890 changeovers is also 18% above the production plan of 754 — no changeover log was attached to the claim pack.',
        'Line labor and film rates are inside benchmark and consistent with the trailing three periods. No issue.'
      ],
      recommendation: 'Certify $4,095,700 and withhold $214,300 until the changeover log is supplied and the overhead rate is corrected to the contracted 12.0% cap.',
      comparables: [
        { id: 'SPC-APX-3180', vendor: 'Apex Co-Packing',       date: 'May 2026', value: 4020000, scope: 'Plant 12 — 91.2k line hours', rate: 26.80 },
        { id: 'SPC-IRN-3094', vendor: 'Ironwood Manufacturing',date: 'May 2026', value: 3760000, scope: 'Plant 7 — 88.4k line hours',  rate: 25.40 },
        { id: 'SPC-APX-3021', vendor: 'Apex Co-Packing',       date: 'Apr 2026', value: 3880000, scope: 'Plant 12 — 89.9k line hours', rate: 26.20 }
      ],
      benchmarkNote: 'Benchmark source: 14 comparable co-manufacturing sites (2023–2026) in the claims data warehouse.',
      checkOverrides: {
        6: { result: 'FLAGGED', detail: 'Changeovers 890 vs production plan 754. Variance +18%. No changeover log attached.' },
        8: { result: 'FLAGGED', detail: 'Overhead recovered at 13.4% vs contracted cap 12.0%. No amendment on file.' }
      },
      po: {
        ref: 'PO-COM-2026-0188',
        description: 'Seasonal co-packing services — Plant 12, FY26',
        vendorLegal: 'Apex Co-Packing Inc.',
        totalValue: 28000000,
        approvedDate: '03 Feb 2026',
        approvedBy: 'VP Finance',
        status: 'Active',
        paidToDate: 15900000,
        thisClaim: 4310000,
        terms: 'Net 30 from certification',
        holdback: 0.03,
        history: [
          { ref: 'SPC-APX-3021', period: 'Apr 2026', claimed: 3880000, approved: 3880000, paid: '20 May 2026', status: 'Paid' },
          { ref: 'SPC-APX-3180', period: 'May 2026', claimed: 4020000, approved: 4020000, paid: '18 Jun 2026', status: 'Paid' }
        ]
      },
      documents: [
        { name: 'SPC-APX-3312 Claim Pack.pdf',        size: '1.8 MB', state: 'Extracted' },
        { name: 'Co-Pack Agreement — Schedule C.pdf', size: '640 KB', state: 'Extracted' },
        { name: 'Plant 12 Production Plan Jun.xlsx',  size: '310 KB', state: 'Extracted' }
      ],
      correspondence: null
    },

    /* -------------------------------------------------- 3. AWAITING VENDOR */
    {
      id: 'SPC-VTX-2210',
      vendor: 'Vertex Packaging Solutions',
      program: 'Corrugate Supply — Q2 Wave',
      category: 'Packaging',
      period: 'Jun 2026 — Period 6',
      amount: 3880000,
      submitted: '18 Jul',
      verdict: 'AWAITING_VENDOR',
      status: 'pending',
      headline: 'Resin pass-through 12% above index. Query issued, 5 days open.',
      exposure: 337600,
      lineItems: [
        { item: 'Corrugate Carton (32 ECT)', unit: '1,000 units', qty: 5240,   rate: 528.00, amount: 2766720, benchmark: '$480 – $540 / 1,000 units', variance: 0,    flag: 'NORMAL' },
        { item: 'PET Resin Pass-Through',    unit: 'lb',          qty: 962000, rate: 0.80,   amount: 769600,  benchmark: '$0.62 – $0.71 / lb (index)', variance: 12.7, flag: 'MODERATE' },
        { item: 'Tooling Amortisation',      unit: 'run',         qty: 44,     rate: 2140.00,amount: 94160,   benchmark: 'Per Schedule D, $2,140 / run', variance: 0,  flag: 'NORMAL' },
        { item: 'Vendor Admin / Overhead',   unit: '% of claim',  qty: null,   rate: 6.9,    amount: 249520,  benchmark: '8.0% – 12.0% of claim value', variance: 0,  flag: 'NORMAL' }
      ],
      aberrations: [
        'PET resin passed through at $0.80 / lb against an index ceiling of $0.71 for the claim period. Variance +12.7%, exposure $86,600.',
        'The supply agreement requires resin to be passed through at the published index plus a fixed 4% conversion margin. The claim applies a 17% margin without a supporting index statement.',
        'Carton pricing, tooling and overhead are all within benchmark.'
      ],
      recommendation: 'Hold certification until the vendor supplies the index statement for the claim period. Query issued 24 Jul with a response deadline of 30 Jul, ahead of the 03 Aug payment run.',
      comparables: [
        { id: 'SPC-VTX-2088', vendor: 'Vertex Packaging Solutions', date: 'May 2026', value: 3610000, scope: '4.9k thousand-unit cartons', rate: 0.69 },
        { id: 'SPC-LKS-2044', vendor: 'Lakeshore Print & Label',    date: 'May 2026', value: 1980000, scope: '2.7k thousand-unit cartons', rate: 0.67 },
        { id: 'SPC-VTX-1955', vendor: 'Vertex Packaging Solutions', date: 'Apr 2026', value: 3440000, scope: '4.7k thousand-unit cartons', rate: 0.66 }
      ],
      benchmarkNote: 'Benchmark source: resin spot index (12-week trailing) plus 6 converter supply agreements.',
      checkOverrides: {
        5: { result: 'FLAGGED', detail: 'PET resin $0.80 / lb vs index ceiling $0.71 / lb for the claim period. Variance +12.7%.' },
        12:{ result: 'WAITING', detail: 'Query VQ-2026-0412 issued 24 Jul. Vendor response outstanding — 5 days open.' }
      },
      po: {
        ref: 'PO-PKG-2026-0092',
        description: 'Corrugate and secondary packaging supply, FY26',
        vendorLegal: 'Vertex Packaging Solutions Inc.',
        totalValue: 19500000,
        approvedDate: '21 Jan 2026',
        approvedBy: 'VP Finance',
        status: 'Active',
        paidToDate: 11040000,
        thisClaim: 3880000,
        terms: 'Net 30 from certification',
        holdback: 0,
        history: [
          { ref: 'SPC-VTX-1955', period: 'Apr 2026', claimed: 3440000, approved: 3440000, paid: '22 May 2026', status: 'Paid' },
          { ref: 'SPC-VTX-2088', period: 'May 2026', claimed: 3610000, approved: 3610000, paid: '19 Jun 2026', status: 'Paid' }
        ]
      },
      documents: [
        { name: 'SPC-VTX-2210 Claim Pack.pdf',           size: '1.5 MB', state: 'Extracted' },
        { name: 'Supply Agreement — Schedule D.pdf',     size: '720 KB', state: 'Extracted' },
        { name: 'Vendor Query VQ-2026-0412.eml',         size: '38 KB',  state: 'Extracted' }
      ],
      correspondence: {
        from: 'PaymentsIQ — Communication Agent (on behalf of Finance Shared Services)',
        to: 'Accounts Team, Vertex Packaging Solutions',
        date: '24 July 2026',
        subject: 'RE: SPC-VTX-2210 — resin pass-through substantiation required',
        body: 'Line 2 of claim SPC-VTX-2210 passes PET resin through at $0.80 / lb. Schedule D of the supply agreement requires pass-through at the published resin index plus a fixed 4% conversion margin. The index for the claim period supports $0.71 / lb inclusive of that margin.\n\nPlease supply the index statement used to derive $0.80 / lb, or issue a corrected claim. A response is required by 30 July to hold your position in the 03 August payment run. Cartons, tooling and overhead on this claim are validated and are not affected by this query.',
        state: 'Sent — awaiting response (5 days open)'
      }
    },

    /* -------------------------------------------------- 4–8. VALIDATED */
    {
      id: 'SPC-IRN-2870', vendor: 'Ironwood Manufacturing', program: 'Contract Manufacturing — Run 44',
      category: 'Co-Manufacturing', period: 'Jun 2026 — Period 6', amount: 3120000, submitted: '22 Jul',
      verdict: 'VALIDATED', status: 'pending', headline: 'All 12 checks passed. Rates inside benchmark on every line.', exposure: 0,
      lineItems: [
        { item: 'Co-Pack Line Labor',       unit: 'hour',       qty: 71800,  rate: 25.40,  amount: 1823720, benchmark: '$22.00 – $28.00 / hour',      variance: 0, flag: 'NORMAL' },
        { item: 'Changeover / Line Set-up', unit: 'changeover', qty: 612,    rate: 704.00, amount: 430848,  benchmark: '$620 – $780 / changeover',    variance: 0, flag: 'NORMAL' },
        { item: 'Shrink Film',              unit: 'lb',         qty: 318000, rate: 1.44,   amount: 457920,  benchmark: '$1.35 – $1.60 / lb',          variance: 0, flag: 'NORMAL' },
        { item: 'Vendor Admin / Overhead',  unit: '% of claim', qty: null,   rate: 10.4,   amount: 407512,  benchmark: '8.0% – 12.0% of claim value', variance: 0, flag: 'NORMAL' }
      ],
      aberrations: [], recommendation: 'No exceptions. Certify in full at $3,120,000 and release into the 03 Aug payment run.',
      comparables: [
        { id: 'SPC-IRN-2744', vendor: 'Ironwood Manufacturing', date: 'May 2026', value: 3040000, scope: 'Plant 7 — 70.1k line hours', rate: 25.10 },
        { id: 'SPC-APX-3180', vendor: 'Apex Co-Packing',        date: 'May 2026', value: 4020000, scope: 'Plant 12 — 91.2k line hours',rate: 26.80 }
      ],
      benchmarkNote: 'Benchmark source: 14 comparable co-manufacturing sites (2023–2026).',
      checkOverrides: {},
      po: { ref: 'PO-COM-2026-0210', description: 'Contract manufacturing services — Plant 7, FY26', vendorLegal: 'Ironwood Manufacturing Co.', totalValue: 21000000, approvedDate: '09 Feb 2026', approvedBy: 'VP Finance', status: 'Active', paidToDate: 9840000, thisClaim: 3120000, terms: 'Net 30 from certification', holdback: 0.03,
        history: [{ ref: 'SPC-IRN-2744', period: 'May 2026', claimed: 3040000, approved: 3040000, paid: '18 Jun 2026', status: 'Paid' }] },
      documents: [{ name: 'SPC-IRN-2870 Claim Pack.pdf', size: '1.2 MB', state: 'Extracted' }], correspondence: null
    },
    {
      id: 'SPC-HBV-2950', vendor: 'Harborview 3PL', program: 'Northeast Storage & Handling',
      category: 'Warehousing', period: 'Jun 2026 — Period 6', amount: 2950000, submitted: '21 Jul',
      verdict: 'VALIDATED', status: 'pending', headline: 'All 12 checks passed. Storage and handling within rate card.', exposure: 0,
      lineItems: [
        { item: 'Ambient Storage',          unit: 'pallet / month', qty: 104000, rate: 16.40, amount: 1705600, benchmark: '$14.00 – $19.00 / pallet / mo', variance: 0, flag: 'NORMAL' },
        { item: 'Pallet In / Out Handling', unit: 'pallet',         qty: 168000, rate: 5.35,  amount: 898800,  benchmark: '$4.50 – $6.25 / pallet',        variance: 0, flag: 'NORMAL' },
        { item: 'Vendor Admin / Overhead',  unit: '% of claim',     qty: null,   rate: 11.7,  amount: 345600,  benchmark: '8.0% – 12.0% of claim value',   variance: 0, flag: 'NORMAL' }
      ],
      aberrations: [], recommendation: 'No exceptions. Certify in full at $2,950,000.',
      comparables: [{ id: 'SPC-HBV-2812', vendor: 'Harborview 3PL', date: 'May 2026', value: 2880000, scope: 'Northeast network — 102k pallets', rate: 16.20 }],
      benchmarkNote: 'Benchmark source: 9 comparable 3PL networks (2024–2026).',
      checkOverrides: {},
      po: { ref: 'PO-WHS-2026-0067', description: 'Warehousing and handling — Northeast network, FY26', vendorLegal: 'Harborview 3PL LLC', totalValue: 17400000, approvedDate: '16 Jan 2026', approvedBy: 'VP Finance', status: 'Active', paidToDate: 8620000, thisClaim: 2950000, terms: 'Net 30 from certification', holdback: 0,
        history: [{ ref: 'SPC-HBV-2812', period: 'May 2026', claimed: 2880000, approved: 2880000, paid: '17 Jun 2026', status: 'Paid' }] },
      documents: [{ name: 'SPC-HBV-2950 Claim Pack.pdf', size: '980 KB', state: 'Extracted' }], correspondence: null
    },
    {
      id: 'SPC-SUM-2640', vendor: 'Summit Display Group', program: 'Holiday Floor Display Rollout',
      category: 'Trade', period: 'Jun 2026 — Period 6', amount: 2640000, submitted: '22 Jul',
      verdict: 'VALIDATED', status: 'pending', headline: 'All 12 checks passed. Display unit cost at benchmark midpoint.', exposure: 0,
      lineItems: [
        { item: 'Floor Display Fabrication', unit: 'unit',       qty: 48200, rate: 41.80, amount: 2014760, benchmark: '$38.00 – $46.00 / unit',      variance: 0, flag: 'NORMAL' },
        { item: 'Kitting & Pack-out',        unit: 'unit',       qty: 48200, rate: 6.20,  amount: 298840,  benchmark: 'Per Schedule B, $5.80 – $6.60',variance: 0, flag: 'NORMAL' },
        { item: 'Freight to DC',             unit: 'unit',       qty: 48200, rate: 1.90,  amount: 91580,   benchmark: 'Per Schedule B, $1.70 – $2.10',variance: 0, flag: 'NORMAL' },
        { item: 'Vendor Admin / Overhead',   unit: '% of claim', qty: null,  rate: 9.6,   amount: 234820,  benchmark: '8.0% – 12.0% of claim value',  variance: 0, flag: 'NORMAL' }
      ],
      aberrations: [], recommendation: 'No exceptions. Certify in full at $2,640,000.',
      comparables: [{ id: 'SPC-SUM-2501', vendor: 'Summit Display Group', date: 'May 2026', value: 2410000, scope: '44.6k floor stands', rate: 41.20 }],
      benchmarkNote: 'Benchmark source: 8 display vendors, trailing 12 months.',
      checkOverrides: {},
      po: { ref: 'PO-TRD-2026-0155', description: 'Seasonal display fabrication and rollout, FY26', vendorLegal: 'Summit Display Group Inc.', totalValue: 12800000, approvedDate: '27 Feb 2026', approvedBy: 'VP Finance', status: 'Active', paidToDate: 5310000, thisClaim: 2640000, terms: 'Net 30 from certification', holdback: 0,
        history: [{ ref: 'SPC-SUM-2501', period: 'May 2026', claimed: 2410000, approved: 2410000, paid: '19 Jun 2026', status: 'Paid' }] },
      documents: [{ name: 'SPC-SUM-2640 Claim Pack.pdf', size: '1.1 MB', state: 'Extracted' }], correspondence: null
    },
    {
      id: 'SPC-CDP-1840', vendor: 'Cedar Point Merchandising', program: 'Retail Reset — Southeast Banner',
      category: 'Trade', period: 'Jun 2026 — Period 6', amount: 1840000, submitted: '23 Jul',
      verdict: 'VALIDATED', status: 'pending', headline: 'All 12 checks passed. Visit count reconciles to store logs.', exposure: 0,
      lineItems: [
        { item: 'Retail Merchandising Visit', unit: 'store visit', qty: 51400, rate: 31.20, amount: 1603680, benchmark: '$28.00 – $34.00 / visit',      variance: 0, flag: 'NORMAL' },
        { item: 'Reset Fixture Kit',          unit: 'kit',         qty: 2140,  rate: 28.40, amount: 60776,   benchmark: 'Per Schedule A, $26 – $31',    variance: 0, flag: 'NORMAL' },
        { item: 'Vendor Admin / Overhead',    unit: '% of claim',  qty: null,  rate: 10.6,  amount: 175544,  benchmark: '8.0% – 12.0% of claim value',  variance: 0, flag: 'NORMAL' }
      ],
      aberrations: [], recommendation: 'No exceptions. Certify in full at $1,840,000.',
      comparables: [{ id: 'SPC-CDP-1702', vendor: 'Cedar Point Merchandising', date: 'May 2026', value: 1710000, scope: '48.1k store visits', rate: 30.90 }],
      benchmarkNote: 'Benchmark source: field service agency rate cards, 11 agencies.',
      checkOverrides: {},
      po: { ref: 'PO-TRD-2026-0163', description: 'Retail merchandising and reset labor, FY26', vendorLegal: 'Cedar Point Merchandising LLC', totalValue: 9600000, approvedDate: '02 Mar 2026', approvedBy: 'Senior Finance Analyst', status: 'Active', paidToDate: 4180000, thisClaim: 1840000, terms: 'Net 30 from certification', holdback: 0,
        history: [{ ref: 'SPC-CDP-1702', period: 'May 2026', claimed: 1710000, approved: 1710000, paid: '20 Jun 2026', status: 'Paid' }] },
      documents: [{ name: 'SPC-CDP-1840 Claim Pack.pdf', size: '870 KB', state: 'Extracted' }], correspondence: null
    },
    {
      id: 'SPC-BRI-1570', vendor: 'BlueRidge Ingredients', program: 'Sweetener & Flavor Supply',
      category: 'Ingredients', period: 'Jun 2026 — Period 6', amount: 1570000, submitted: '23 Jul',
      verdict: 'VALIDATED', status: 'pending', headline: 'All 12 checks passed. Commodity pass-through matches index.', exposure: 0,
      lineItems: [
        { item: 'Sweetener Concentrate', unit: 'lb',         qty: 1840000, rate: 0.62, amount: 1140800, benchmark: 'Index $0.58 – $0.66 / lb',    variance: 0, flag: 'NORMAL' },
        { item: 'Flavor System',         unit: 'lb',         qty: 41200,   rate: 6.40, amount: 263680,  benchmark: 'Per Schedule A, $6.10 – $6.80',variance: 0, flag: 'NORMAL' },
        { item: 'Inbound Freight',       unit: 'lb',         qty: 1881200, rate: 0.02, amount: 37624,   benchmark: '$0.018 – $0.024 / lb',        variance: 0, flag: 'NORMAL' },
        { item: 'Vendor Admin / Overhead',unit: '% of claim',qty: null,    rate: 8.2,  amount: 127896,  benchmark: '8.0% – 12.0% of claim value', variance: 0, flag: 'NORMAL' }
      ],
      aberrations: [], recommendation: 'No exceptions. Certify in full at $1,570,000.',
      comparables: [{ id: 'SPC-BRI-1441', vendor: 'BlueRidge Ingredients', date: 'May 2026', value: 1490000, scope: '1.76M lb sweetener', rate: 0.61 }],
      benchmarkNote: 'Benchmark source: commodity index, 12-week trailing, plus 5 supply agreements.',
      checkOverrides: {},
      po: { ref: 'PO-ING-2026-0044', description: 'Sweetener and flavor supply, FY26', vendorLegal: 'BlueRidge Ingredients Corp.', totalValue: 14200000, approvedDate: '12 Jan 2026', approvedBy: 'VP Finance', status: 'Active', paidToDate: 7060000, thisClaim: 1570000, terms: 'Net 45 from certification', holdback: 0,
        history: [{ ref: 'SPC-BRI-1441', period: 'May 2026', claimed: 1490000, approved: 1490000, paid: '26 Jun 2026', status: 'Paid' }] },
      documents: [{ name: 'SPC-BRI-1570 Claim Pack.pdf', size: '760 KB', state: 'Extracted' }], correspondence: null
    },

    /* -------------------------------------------------- 9–10. AUTO-APPROVE */
    {
      id: 'SPC-LKS-0780', vendor: 'Lakeshore Print & Label', program: 'Label Conversion — Line 3',
      category: 'Packaging', period: 'Jun 2026 — Period 6', amount: 780000, submitted: '23 Jul',
      verdict: 'AUTO_APPROVE', status: 'pending', headline: 'Clean check run below the review threshold. Queued for straight-through release.', exposure: 0,
      lineItems: [
        { item: 'Pressure-Sensitive Label', unit: '1,000 units', qty: 8600, rate: 74.20, amount: 638120, benchmark: '$68 – $79 / 1,000 units',      variance: 0, flag: 'NORMAL' },
        { item: 'Plate & Die Charges',      unit: 'set',         qty: 26,   rate: 1420.00,amount: 36920, benchmark: 'Per Schedule B, $1,300 – $1,550',variance: 0, flag: 'NORMAL' },
        { item: 'Vendor Admin / Overhead',  unit: '% of claim',  qty: null, rate: 10.3,  amount: 104960, benchmark: '8.0% – 12.0% of claim value',  variance: 0, flag: 'NORMAL' }
      ],
      aberrations: [], recommendation: 'No exceptions. Straight-through release at $780,000 under the Senior Finance Analyst delegation.',
      comparables: [{ id: 'SPC-LKS-0702', vendor: 'Lakeshore Print & Label', date: 'May 2026', value: 742000, scope: '8.2k thousand labels', rate: 73.80 }],
      benchmarkNote: 'Benchmark source: 6 label converters, trailing 12 months.',
      checkOverrides: {},
      po: { ref: 'PO-PKG-2026-0118', description: 'Label conversion services, FY26', vendorLegal: 'Lakeshore Print & Label Inc.', totalValue: 5400000, approvedDate: '19 Jan 2026', approvedBy: 'Senior Finance Analyst', status: 'Active', paidToDate: 2260000, thisClaim: 780000, terms: 'Net 30 from certification', holdback: 0,
        history: [{ ref: 'SPC-LKS-0702', period: 'May 2026', claimed: 742000, approved: 742000, paid: '21 Jun 2026', status: 'Paid' }] },
      documents: [{ name: 'SPC-LKS-0780 Claim Pack.pdf', size: '540 KB', state: 'Extracted' }], correspondence: null
    },
    {
      id: 'SPC-CRW-0490', vendor: 'Crestwood Freight Systems', program: 'Spot Market Backhaul',
      category: 'Logistics', period: 'Jun 2026 — Period 6', amount: 490000, submitted: '23 Jul',
      verdict: 'AUTO_APPROVE', status: 'pending', headline: 'Clean check run below the review threshold. Queued for straight-through release.', exposure: 0,
      lineItems: [
        { item: 'Spot Backhaul Linehaul', unit: 'mile',       qty: 186000, rate: 2.22, amount: 412920, benchmark: '$2.10 – $2.45 / mile',        variance: 0, flag: 'NORMAL' },
        { item: 'Fuel Surcharge',         unit: 'mile',       qty: 186000, rate: 0.33, amount: 61380,  benchmark: '$0.28 – $0.38 / mile',        variance: 0, flag: 'NORMAL' },
        { item: 'Vendor Admin / Overhead',unit: '% of claim', qty: null,   rate: 3.2,  amount: 15700,  benchmark: '8.0% – 12.0% of claim value', variance: 0, flag: 'NORMAL' }
      ],
      aberrations: [], recommendation: 'No exceptions. Straight-through release at $490,000 under the Senior Finance Analyst delegation.',
      comparables: [{ id: 'SPC-CRW-0411', vendor: 'Crestwood Freight Systems', date: 'May 2026', value: 466000, scope: '178k spot miles', rate: 2.19 }],
      benchmarkNote: 'Benchmark source: 22 comparable regional dry-van programs (2023–2026).',
      checkOverrides: {},
      po: { ref: 'PO-LOG-2026-0402', description: 'Spot market backhaul capacity, FY26', vendorLegal: 'Crestwood Freight Systems LLC', totalValue: 6200000, approvedDate: '30 Jan 2026', approvedBy: 'Senior Finance Analyst', status: 'Active', paidToDate: 1980000, thisClaim: 490000, terms: 'Net 45 from certification', holdback: 0,
        history: [{ ref: 'SPC-CRW-0411', period: 'May 2026', claimed: 466000, approved: 466000, paid: '24 Jun 2026', status: 'Paid' }] },
      documents: [{ name: 'SPC-CRW-0490 Claim Pack.pdf', size: '410 KB', state: 'Extracted' }], correspondence: null
    }
  ];

  /* ---------- Build the full 12-check run for a claim ---------- */
  const PASS_DETAIL = {
    1:  c => `No prior claim from ${c.vendor} for ${c.period}. Last claim: ${c.po.history.length ? c.po.history[c.po.history.length - 1].ref : 'none on file'}.`,
    2:  c => `${c.po.vendorLegal} — active, tax details verified, banking unchanged for 14 months.`,
    3:  c => `PO ${c.po.ref} located. Status: ${c.po.status}. Approved by ${c.po.approvedBy} on ${c.po.approvedDate}.`,
    4:  c => `Approved PO $${fmt(c.po.totalValue)} | Paid to date $${fmt(c.po.paidToDate)} | This claim $${fmt(c.amount)} | Remaining $${fmt(c.po.totalValue - c.po.paidToDate - c.amount)}.`,
    5:  c => `All ${c.lineItems.length} line items priced within the contracted rate schedule.`,
    6:  c => `Volumes reconcile to source system records within tolerance (±2%).`,
    7:  c => `Delivery / service confirmation received for the full claim period.`,
    8:  c => `No open change orders. Rate schedule in force is the executed version.`,
    9:  c => c.po.holdback ? `Contract holdback ${(c.po.holdback * 100).toFixed(0)}% | Deducted $${fmt(Math.round(c.amount * c.po.holdback))} | Status: correct.` : `No holdback applies under this agreement.`,
    10: c => `Sales tax computed at the correct jurisdictional rate and excluded from the certified base.`,
    11: c => `Payment terms ${c.po.terms} — consistent with the master agreement.`,
    12: c => `No prior rejection or credit note open against ${c.vendor}.`
  };

  function checksFor(claim) {
    return CHECK_TEMPLATE.map(t => {
      const ov = claim.checkOverrides[t.id];
      return {
        id: t.id,
        name: t.name,
        system: t.system,
        result: ov ? ov.result : 'PASSED',
        detail: ov ? ov.detail : PASS_DETAIL[t.id](claim)
      };
    });
  }

  /* ---------- Trend series (last 8 weeks) ---------- */
  const WEEKLY = [
    { label: 'W22', cleared: 18.4, flagged: 3.1, atRisk: 0.94 },
    { label: 'W23', cleared: 21.2, flagged: 2.4, atRisk: 0.71 },
    { label: 'W24', cleared: 19.8, flagged: 4.6, atRisk: 1.42 },
    { label: 'W25', cleared: 24.1, flagged: 3.8, atRisk: 1.11 },
    { label: 'W26', cleared: 22.6, flagged: 5.2, atRisk: 1.68 },
    { label: 'W27', cleared: 25.4, flagged: 3.3, atRisk: 0.88 },
    { label: 'W28', cleared: 23.9, flagged: 4.1, atRisk: 1.24 },
    { label: 'W29', cleared: 23.4, flagged: 4.6, atRisk: 1.50 }
  ];

  /* ---------- Category variance (vs benchmark ceiling) ---------- */
  const CATEGORY_VARIANCE = [
    { category: 'Logistics',        variance: 14.2, spend: 11.3, breach: true },
    { category: 'Co-Manufacturing', variance: 5.8,  spend: 7.4,  breach: true },
    { category: 'Packaging',        variance: 4.1,  spend: 4.7,  breach: true },
    { category: 'Warehousing',      variance: -1.6, spend: 2.9,  breach: false },
    { category: 'Trade',            variance: -2.4, spend: 4.5,  breach: false },
    { category: 'Ingredients',      variance: -3.1, spend: 1.6,  breach: false }
  ];

  /* ---------- Recovery ledger (YTD) ---------- */
  const RECOVERY = [
    { month: 'Feb', recovered: 0.42 }, { month: 'Mar', recovered: 0.61 },
    { month: 'Apr', recovered: 0.38 }, { month: 'May', recovered: 0.94 },
    { month: 'Jun', recovered: 1.12 }, { month: 'Jul', recovered: 1.50 }
  ];

  /* ---------- Vendor risk register ---------- */
  const VENDOR_RISK = [
    { vendor: 'Northline Logistics',       claims: 9,  flagged: 4, exposure: 1841000, trend: 'up',   note: 'Repeat linehaul over-claim across three periods' },
    { vendor: 'Apex Co-Packing',           claims: 8,  flagged: 3, exposure: 486000,  trend: 'up',   note: 'Overhead recovered above contracted cap' },
    { vendor: 'Vertex Packaging Solutions',claims: 7,  flagged: 2, exposure: 337600,  trend: 'flat', note: 'Resin pass-through margin above schedule' },
    { vendor: 'Summit Display Group',      claims: 6,  flagged: 1, exposure: 0,       trend: 'down', note: 'Single freight variance, since corrected' },
    { vendor: 'Harborview 3PL',            claims: 11, flagged: 0, exposure: 0,       trend: 'flat', note: 'No exceptions in trailing 12 months' },
    { vendor: 'Ironwood Manufacturing',    claims: 8,  flagged: 0, exposure: 0,       trend: 'down', note: 'No exceptions in trailing 12 months' }
  ];

  function fmt(n) { return Number(n).toLocaleString('en-US'); }

  return {
    VERDICT, THRESHOLDS, approverFor, BENCHMARKS, SYSTEMS, AGENTS,
    CHECK_TEMPLATE, CLAIMS, checksFor, WEEKLY, CATEGORY_VARIANCE, RECOVERY, VENDOR_RISK
  };
})();
