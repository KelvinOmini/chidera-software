const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel,
  BorderStyle, WidthType, ShadingType, PageNumber, PageBreak,
  TabStopType, NumberFormat
} = require('docx');
const fs = require('fs');

const F = "Times New Roman", BS = 24, CW = 9360;
const bdr = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const BORDERS = { top: bdr, bottom: bdr, left: bdr, right: bdr };
const NONE_BDR = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const NO_BORDERS = { top: NONE_BDR, bottom: NONE_BDR, left: NONE_BDR, right: NONE_BDR };

// ── helpers ──────────────────────────────────────────────────────────────
function p(text, opts = {}) {
  return new Paragraph({
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    spacing: { before: opts.before ?? 120, after: opts.after ?? 120, line: 360, lineRule: "auto" },
    indent: opts.first ? { firstLine: 720 } : undefined,
    children: [new TextRun({
      text, font: F, size: opts.sz ?? BS,
      bold: !!opts.bold, italics: !!opts.italic, underline: opts.underline ? {} : undefined, color: "000000"
    })]
  });
}
function h1(t) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER,
    spacing: { before: 480, after: 240 },
    children: [new TextRun({ text: t, font: F, size: 28, bold: true, color: "000000" })]
  });
}
function h2(t) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2, spacing: { before: 360, after: 180 },
    children: [new TextRun({ text: t, font: F, size: 26, bold: true, color: "000000" })]
  });
}
function h3(t) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3, spacing: { before: 240, after: 120 },
    children: [new TextRun({ text: t, font: F, size: 24, bold: true, italics: true, color: "000000" })]
  });
}
function bl(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 60, after: 60, line: 360, lineRule: "auto" },
    children: [new TextRun({ text, font: F, size: BS, color: "000000" })]
  });
}
function num(text) {
  return new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    spacing: { before: 60, after: 60, line: 360, lineRule: "auto" },
    children: [new TextRun({ text, font: F, size: BS, color: "000000" })]
  });
}
function pb() { return new Paragraph({ children: [new PageBreak()] }); }
function blank(n = 1) { return Array.from({ length: n }, () => new Paragraph({ spacing: { before: 0, after: 0, line: 240, lineRule: "auto" }, children: [new TextRun({ text: "" })] })); }
function mixed(runs) {
  return new Paragraph({
    spacing: { before: 90, after: 90, line: 360, lineRule: "auto" },
    children: runs.map(([t, b]) => new TextRun({ text: t, font: F, size: BS, bold: !!b, color: "000000" }))
  });
}
function tocLine(label, page, indent = false) {
  return new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: CW }],
    spacing: { before: 60, after: 60, line: 300, lineRule: "auto" },
    indent: indent ? { left: 480 } : undefined,
    children: [
      new TextRun({ text: label, font: F, size: BS, bold: label.startsWith("CHAPTER") }),
      new TextRun({ text: "\t" + page, font: F, size: BS })
    ]
  });
}
function hRow(cells, widths, shade = "D9D9D9") {
  return new TableRow({
    tableHeader: true, children: cells.map((t, i) =>
      new TableCell({
        borders: BORDERS, width: { size: widths[i], type: WidthType.DXA },
        shading: { fill: shade, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: t, font: F, size: 22, bold: true, color: "000000" })]
        })]
      }))
  });
}
function dRow(cells, widths, alt) {
  return new TableRow({
    children: cells.map((t, i) =>
      new TableCell({
        borders: BORDERS, width: { size: widths[i], type: WidthType.DXA },
        shading: { fill: alt ? "F5F5F5" : "FFFFFF", type: ShadingType.CLEAR },
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [new Paragraph({ children: [new TextRun({ text: t, font: F, size: 20, color: "000000" })] })]
      }))
  });
}
function tbl(headers, rows, widths) {
  return new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: widths,
    rows: [hRow(headers, widths), ...rows.map((r, i) => dRow(r, widths, i % 2 !== 0))]
  });
}
function figCaption(num, title) {
  return new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 60, after: 180 },
    children: [new TextRun({ text: `Figure ${num}: ${title}`, font: F, size: BS, bold: true, color: "000000" })]
  });
}
function imgBox(num, title, h = 3600) {
  // Placeholder box for image
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { before: 120, after: 0 },
      children: [new TextRun({ text: `[ Image: ${title} ]`, font: F, size: 20, italics: true, color: "555555" })]
    }),
    figCaption(num, title)
  ];
}

const children = [];

// ════════════════════════════════════════════════════
//  TITLE PAGE
// ════════════════════════════════════════════════════
children.push(
  ...blank(2),
  p("ARTHUR JARVIS UNIVERSITY", { center: true, sz: 30, bold: true, before: 0, after: 60 }),
  p("AKPABUYO, CROSS RIVER STATE, NIGERIA", { center: true, sz: 24, before: 0, after: 60 }),
  ...blank(2),
  p("A PROJECT ON", { center: true, sz: 24, bold: true, before: 0, after: 60 }),
  ...blank(1),
  p("DESIGN AND IMPLEMENTATION OF A SMART INVENTORY MANAGEMENT SYSTEM", { center: true, sz: 26, bold: true, before: 0, after: 60 }),
  ...blank(2),
  p("BY", { center: true, sz: 24, before: 0, after: 60 }),
  ...blank(1),
  p("OBILO-CHIJIOKE CHIDERA FIDELIS", { center: true, sz: 26, bold: true, before: 0, after: 60 }),
  p("TRACK NUMBER: 22/132012", { center: true, sz: 24, before: 0, after: 120 }),
  ...blank(2),
  p("SUBMITTED TO", { center: true, sz: 24, bold: true, before: 0, after: 60 }),
  p("THE DEPARTMENT OF MATHEMATICS AND COMPUTER SCIENCE", { center: true, sz: 24, bold: true, before: 0, after: 60 }),
  p("FACULTY OF NATURAL AND APPLIED SCIENCES", { center: true, sz: 24, bold: true, before: 0, after: 60 }),
  p("ARTHUR JARVIS UNIVERSITY, AKPABUYO, CROSS RIVER STATE", { center: true, sz: 24, bold: true, before: 0, after: 120 }),
  ...blank(2),
  p("IN PARTIAL FULFILMENT OF THE REQUIREMENT FOR THE AWARD OF", { center: true, sz: 24, before: 0, after: 60 }),
  p("BACHELOR OF SCIENCE (B.Sc.) IN COMPUTER SCIENCE", { center: true, sz: 24, bold: true, before: 0, after: 120 }),
  ...blank(2),
  p("JULY 2026", { center: true, sz: 24, bold: true, before: 0, after: 0 }),
  pb()
);

// ════════════════════════════════════════════════════
//  CERTIFICATION
// ════════════════════════════════════════════════════
children.push(
  h1("CERTIFICATION"),
  p("We hereby certify that this project titled \"Design and Implementation of a Smart Inventory Management System\" submitted by OBILO-CHIJIOKE CHIDERA FIDELIS, Track Number 22/132012, to the Department of Mathematics and Computer Science, Faculty of Natural and Applied Sciences, Arthur Jarvis University, Akpabuyo, was carried out under supervision, has been examined and found to have met the regulations of Arthur Jarvis University. We therefore recommend this work for the award of the Bachelor of Sciences (B.Sc.) certificate in Computer Science.", { first: true }),
  ...blank(3),
  p("________________________________                          Signature: _________________"),
  p("(Supervisor)                                              Date: ______________________"),
  ...blank(2),
  p("Dr. Samuel Essang                                         Signature: _________________"),
  p("(Ag. Head of Department)                                  Date: ______________________"),
  ...blank(2),
  p("________________________________                          Signature: _________________"),
  p("(External Examiner)                                       Date: ______________________"),
  ...blank(2),
  p("________________________________                          Signature: _________________"),
  p("(Dean of Faculty)                                         Date: ______________________"),
  pb()
);

// ════════════════════════════════════════════════════
//  DECLARATION
// ════════════════════════════════════════════════════
children.push(
  h1("DECLARATION"),
  p("I hereby declare that this project titled \"Design and Implementation of a Smart Inventory Management System\" is original and has been written by me. It is a record of my own research project and has not been submitted in whole or in part to any other university or institution for any degree or qualification.", { first: true }),
  p("All sources of information used in this work have been duly acknowledged through appropriate citations in accordance with academic conventions.", { first: true }),
  ...blank(3),
  p("OBILO-CHIJIOKE CHIDERA FIDELIS                            Signature: ________________"),
  p("(Student/Candidate)                                       Date: _____________________"),
  pb()
);

// ════════════════════════════════════════════════════
//  ACKNOWLEDGEMENT
// ════════════════════════════════════════════════════
children.push(
  h1("ACKNOWLEDGEMENT"),
  p("First and foremost, I give all glory and honour to God Almighty for His grace, wisdom, strength, and guidance throughout the duration of this project. Without His divine enablement, this work would not have been possible.", { first: true }),
  p("I would like to express my deepest appreciation to my father for his unwavering support, encouragement, and belief in my abilities throughout my academic journey. His guidance, sacrifices, and consistent motivation have played an indispensable role in shaping who I am and what I have achieved.", { first: true }),
  p("My sincere and heartfelt gratitude also goes to my mother for her constant love, fervent prayers, and tireless motivation. Her care, patience, and encouragement have been an enduring source of strength and inspiration during both the challenging and rewarding moments of this project.", { first: true }),
  p("I wish to sincerely thank my project supervisor for their expert guidance, constructive criticism, valuable intellectual insights, and consistent support throughout the design and development of this project. Their direction and mentorship significantly contributed to the academic rigour and practical quality of this work.", { first: true }),
  p("I am also grateful to all the lecturers and academic staff of the Department of Mathematics and Computer Science at Arthur Jarvis University for the solid educational foundation they have provided throughout my degree programme. The knowledge and skills imparted in the classroom have been directly reflected in the design and implementation of this system.", { first: true }),
  p("Finally, I acknowledge myself for the dedication, resilience, and sustained hard work invested in completing this project. The journey was demanding, but the commitment to see it through to completion made it possible. I also acknowledge all researchers and authors whose published works I have consulted and cited in this study.", { first: true }),
  pb()
);

// ════════════════════════════════════════════════════
//  ABSTRACT
// ════════════════════════════════════════════════════
children.push(
  h1("ABSTRACT"),
  p("Inventory management remains a critical operational challenge for small and medium-scale enterprises (SMEs) in developing economies such as Nigeria, where widespread reliance on manual methods — paper-based records, handwritten stock cards, and spreadsheet files — frequently leads to human errors, stock discrepancies, delayed reporting, stockouts, overstocking, and poor data-driven decision-making. These inefficiencies impose significant financial burdens on businesses and hinder their competitiveness in an increasingly digital economy. This study addresses these limitations by designing and implementing a web-based Smart Inventory Management System using the Python programming language and the Django web framework.", { first: true }),
  p("The primary aim of the study was to automate inventory monitoring, control, and reporting processes to enhance data accuracy, operational efficiency, and evidence-based decision-making for SME operators. Specific objectives included gathering and analysing system requirements through synthetic data analysis and a structured review of relevant literature; designing a scalable, modular, three-tier web-based architecture; implementing core system functionalities using Django 4.x and a PostgreSQL 15 relational database; integrating asynchronous background processing through Celery and Redis; and rigorously testing the system for reliability, security, and performance under realistic business conditions.", { first: true }),
  p("The system adopts a three-tier architecture comprising presentation, application, and data layers, with clearly separated functional modules covering: role-based user authentication (Admin, Manager, and Staff access levels); full inventory CRUD operations for items, categories, and suppliers; sales processing with automatic stock quantity adjustment; automated low-stock reorder alerts executed via Celery background tasks; and comprehensive analytical dashboards featuring real-time operational metrics and Chart.js visualisations. A normalised relational database schema enforces referential integrity across all entities, while security features include PBKDF2 SHA256 password hashing, Cross-Site Request Forgery (CSRF) protection, HTTP Strict Transport Security (HSTS), and JSON Web Token (JWT) authentication for the versioned REST API (30+ endpoints). The development methodology adopted was Agile Scrum, enabling iterative, feedback-driven development across structured sprints.", { first: true }),
  p("System performance was validated through 62 comprehensive Pytest cases achieving a 100% pass rate, with successful handling of concurrent stock transactions through database-level atomic locking using Django's select_for_update() mechanism, and optimised dashboard loading times achieved through SQL-level ORM aggregations that eliminate N+1 query bottlenecks. A realistic Nigerian-context dataset comprising 35 inventory items with Naira (₦) valuations, 7 suppliers, 8 product categories, and 40 stock transaction records was used to validate the system under representative business conditions.", { first: true }),
  p("Results demonstrate that the system effectively eliminates the most common manual inventory management deficiencies, delivers real-time insights into stock movements, sales performance, and profitability, and provides an intuitive Glassmorphism user interface that is accessible to non-technical SME operators without requiring extensive training. The solution directly addresses identified research gaps in the literature, particularly the absence of user-friendly analytical reporting, SME-focused automation without expensive hardware dependencies, and affordable alternatives to complex enterprise inventory software.", { first: true }),
  p("This project contributes a practical, cost-effective, and technically scalable inventory management tool that supports operational efficiency, reduces financial losses from poor stock control, and promotes digital transformation among small enterprises in Nigeria. Future enhancements recommended include mobile application integration, AI-based demand forecasting, payment gateway support, and optional IoT or RFID hardware integration for automated stock counting.", { first: true }),
  ...blank(1),
  p("Keywords: Smart inventory management system, web-based inventory, Django framework, SME inventory, automated alerts, analytical reporting, stock control, Python web application, PostgreSQL, role-based access control.", { italic: true }),
  pb()
);

// ════════════════════════════════════════════════════
//  TABLE OF CONTENTS
// ════════════════════════════════════════════════════
children.push(
  h1("TABLE OF CONTENTS"),
  tocLine("Certification", "ii"), tocLine("Declaration", "iii"),
  tocLine("Acknowledgement", "iv"), tocLine("Abstract", "v"),
  tocLine("Table of Contents", "vi"), tocLine("List of Tables", "viii"),
  tocLine("List of Figures", "ix"), tocLine("List of Abbreviations", "x"),
  tocLine("CHAPTER ONE: INTRODUCTION", "1"),
  tocLine("1.1  Background of the Study", "1", true),
  tocLine("1.2  Problem Statement", "4", true),
  tocLine("1.3  Aim and Objectives of the Study", "6", true),
  tocLine("1.4  Justification of the Study", "7", true),
  tocLine("1.5  Scope and Limitations of the Study", "9", true),
  tocLine("1.6  Significance of the Study", "10", true),
  tocLine("1.7  Definition of Key Terms", "12", true),
  tocLine("CHAPTER TWO: LITERATURE REVIEW", "14"),
  tocLine("2.1  Conceptual Review", "14", true),
  tocLine("2.2  Theoretical Framework", "20", true),
  tocLine("2.3  Review of Related Works", "23", true),
  tocLine("2.4  Research Gap", "31", true),
  tocLine("CHAPTER THREE: SYSTEM DESIGN AND METHODOLOGY", "33"),
  tocLine("3.1  Overview", "33", true),
  tocLine("3.2  Methodology", "33", true),
  tocLine("3.3  System Analysis", "35", true),
  tocLine("3.4  System Design", "39", true),
  tocLine("CHAPTER FOUR: RESULTS AND INTERPRETATION", "50"),
  tocLine("4.1  Introduction", "50", true),
  tocLine("4.2  Development Tools", "51", true),
  tocLine("4.3  System Modules and Functional Components", "53", true),
  tocLine("4.4  Database Implementation and Dataset Characteristics", "56", true),
  tocLine("4.5  Software Interfaces", "59", true),
  tocLine("4.6  Discussion of Results", "63", true),
  tocLine("4.7  Summary", "66", true),
  tocLine("CHAPTER FIVE: CONCLUSION AND RECOMMENDATIONS", "68"),
  tocLine("5.1  Summary of Findings", "68", true),
  tocLine("5.2  Achievement of Research Objectives", "70", true),
  tocLine("5.3  Contributions to Knowledge and Practice", "72", true),
  tocLine("5.4  Conclusions", "73", true),
  tocLine("5.5  Recommendations", "74", true),
  tocLine("5.6  Suggestions for Future Work", "76", true),
  tocLine("5.7  Closing Remark", "78", true),
  tocLine("References", "79"),
  tocLine("Appendix A: Database Schema and Entity-Relationship Diagram", "85"),
  tocLine("Appendix B: Key Source Code Snippets", "87"),
  tocLine("Appendix C: Sample Test Cases", "90"),
  tocLine("Appendix D: User Manual and Quick Start Guide", "91"),
  tocLine("Appendix E: Sample Dataset", "92"),
  tocLine("Appendix F: List of Tables", "93"),
  tocLine("Appendix G: List of Figures", "94"),
  pb()
);

// ════════════════════════════════════════════════════
//  LIST OF TABLES
// ════════════════════════════════════════════════════
children.push(
  h1("LIST OF TABLES"),
  ...[
    ["Table 2.1", "Summary of Manual vs. Smart Inventory Management Challenges", "5"],
    ["Table 2.2", "Comparison of Web-Based Inventory Systems in Related Works", "24"],
    ["Table 2.3", "Research Gaps and Proposed Solutions", "32"],
    ["Table 3.1", "Functional Requirements of the Smart Inventory Management System", "37"],
    ["Table 3.2", "Non-Functional Requirements", "38"],
    ["Table 3.3", "System Module Descriptions and Programming Structure", "40"],
    ["Table 3.4", "Database Table — accounts_customuser", "43"],
    ["Table 3.5", "Database Table — inventory_category", "44"],
    ["Table 3.6", "Database Table — inventory_supplier", "44"],
    ["Table 3.7", "Database Table — inventory_item", "45"],
    ["Table 3.8", "Database Table — operations_stocktransaction", "46"],
    ["Table 3.9", "Database Table — alerts", "46"],
    ["Table 3.10", "System Controls Implemented", "47"],
    ["Table 4.1", "Development Tools and Technology Stack", "51"],
    ["Table 4.2", "Dataset Characteristics — Nigerian Business Context", "57"],
    ["Table 4.3", "Pytest Test Coverage Summary", "64"],
    ["Table 4.4", "Performance and Security Outcomes", "65"],
    ["Table 5.1", "Achievement of Research Objectives", "70"],
    ["Table A.1", "Sample Nigerian Inventory Dataset — Selected Items", "92"],
    ["Table A.2", "Sample User Dataset", "92"],
  ].map(([n, t, pg]) => new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: CW }],
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text: `${n}: ${t}`, font: F, size: BS }), new TextRun({ text: "\t" + pg, font: F, size: BS })]
  })),
  pb()
);

// ════════════════════════════════════════════════════
//  LIST OF FIGURES
// ════════════════════════════════════════════════════
children.push(
  h1("LIST OF FIGURES"),
  ...[
    ["Figure 1.1", "Conceptual Framework of the Smart Inventory Management System", "3"],
    ["Figure 2.1", "Technology Acceptance Model (TAM) Adapted for This Study", "22"],
    ["Figure 2.2", "Systems Theory Applied to Inventory Management", "23"],
    ["Figure 3.1", "Three-Tier System Architecture", "41"],
    ["Figure 3.2", "Use Case Diagram — Inventory Management System", "42"],
    ["Figure 3.3", "UML Class Diagram — Core Entities and Relationships", "43"],
    ["Figure 3.4", "Activity Diagram — Stock Alert Notification Workflow", "44"],
    ["Figure 3.5", "Entity-Relationship Diagram — Database Schema", "48"],
    ["Figure 4.1", "Authentication Screen (Login Interface)", "59"],
    ["Figure 4.2", "Main Dashboard — Overview with KPI Cards and Charts", "60"],
    ["Figure 4.3", "Inventory List View — Item Table with Status Tags", "61"],
    ["Figure 4.4", "Stock Transaction History View", "62"],
  ].map(([n, t, pg]) => new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: CW }],
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text: `${n}: ${t}`, font: F, size: BS }), new TextRun({ text: "\t" + pg, font: F, size: BS })]
  })),
  pb()
);

// ════════════════════════════════════════════════════
//  LIST OF ABBREVIATIONS
// ════════════════════════════════════════════════════
children.push(
  h1("LIST OF ABBREVIATIONS"),
  tbl(["Abbreviation", "Full Meaning"], [
    ["ACID", "Atomicity, Consistency, Isolation, Durability"],
    ["API", "Application Programming Interface"],
    ["CSRF", "Cross-Site Request Forgery"],
    ["CRUD", "Create, Read, Update, Delete"],
    ["DRF", "Django Rest Framework"],
    ["EOQ", "Economic Order Quantity"],
    ["ERD", "Entity-Relationship Diagram"],
    ["HSTS", "HTTP Strict Transport Security"],
    ["HTML", "HyperText Markup Language"],
    ["ICT", "Information and Communications Technology"],
    ["IST", "Information Systems Theory"],
    ["JWT", "JSON Web Token"],
    ["MVC", "Model-View-Controller"],
    ["MVT", "Model-View-Template"],
    ["ORM", "Object-Relational Mapper"],
    ["PBKDF2", "Password-Based Key Derivation Function 2"],
    ["RBAC", "Role-Based Access Control"],
    ["REST", "Representational State Transfer"],
    ["RFID", "Radio-Frequency Identification"],
    ["SKU", "Stock Keeping Unit"],
    ["SME", "Small and Medium-Scale Enterprise"],
    ["SQL", "Structured Query Language"],
    ["TAM", "Technology Acceptance Model"],
    ["UI", "User Interface"],
    ["UML", "Unified Modelling Language"],
    ["URL", "Uniform Resource Locator"],
    ["UUID", "Universally Unique Identifier"],
  ], [2200, 7160]),
  pb()
);

// ════════════════════════════════════════════════════
//  CHAPTER ONE
// ════════════════════════════════════════════════════
children.push(h1("CHAPTER ONE"), h1("INTRODUCTION"));
children.push(
  h2("1.1 Background of the Study"),
  p("Inventory management is a fundamental component of business operations, particularly for organisations involved in the storage, sale, and distribution of goods and services. According to Illiemena, Aniefor, and Odukoya (2022), effective inventory management enables businesses to maintain appropriate quantities of stock by ensuring consistent coordination of material availability, utilisation, control, and acquisition processes. Well-executed inventory management supports optimal stock levels, minimises waste, reduces operational disruptions, and enhances overall organisational performance across all sectors of the economy.", { first: true }),
  p("Despite its central importance to business sustainability, many small- and medium-scale enterprises (SMEs) in Nigeria and other developing economies continue to depend predominantly on manual inventory methods — paper-based records, handwritten stock cards, and spreadsheet systems — to document transactions and track stock movements. These traditional approaches, while low-cost and simple to deploy initially, are inherently time-consuming, highly susceptible to human errors including miscalculations, omissions, and data inconsistencies, and frequently result in inaccurate or outdated inventory information (Nemtajelai & Mbohwa, 2016). As transaction volumes increase with business growth, the operational inefficiencies of manual systems become progressively more pronounced, often leading to stockouts that result in missed sales, overstocking that ties up capital unnecessarily, misplaced goods, and financial discrepancies that negatively affect both profitability and customer satisfaction (Munyaka & Yadavalli, 2022).", { first: true }),
  p("The operational consequences of ineffective inventory management extend beyond simple stock discrepancies. Businesses operating on manual systems typically experience delayed and inaccurate financial reporting, difficulty determining true profit margins on individual products, inability to identify fast-moving versus slow-moving stock without time-consuming manual analysis, and challenges in making evidence-based purchasing decisions. For Nigerian SMEs operating in a competitive market environment with limited capital reserves, these inefficiencies can be the difference between business survival and closure. Effective inventory management is therefore not merely a convenience but an essential requirement for the operational success, growth, and sustainability of small businesses (Munyaka & Yadavalli, 2022; Olowolaju & Mogaji, 2024).", { first: true }),
  p("With advancements in digital technologies over the past two decades, the adoption of smart inventory management systems has become increasingly important and financially accessible even for small enterprises. Smart systems utilise automated digital tools — relational databases, web-based interfaces, analytical reporting engines, and background task processors — to record, update, and monitor inventory activities in real time without the errors and delays inherent in manual processing. These systems support accurate record-keeping, generate timely analytical reports on sales performance and stock movement, minimise human error through automated calculations and validation rules, and facilitate data-driven decision-making that improves purchasing efficiency and profitability (Ismail & Abdullah, 2019; Kumar & Ramasamy, 2020).", { first: true }),
  p("As emphasised by the World Bank (2021), digital transformation represents a critical enabler of operational efficiency and improved market competitiveness for SMEs in developing economies. Access to affordable, web-based management tools is identified as one of the most impactful interventions that can accelerate SME productivity and resilience. Similarly, Oberholzer (2021) notes that business analytics tools — including inventory dashboards and reporting features — significantly enhance the quality and speed of managerial decisions in small enterprises when integrated directly into daily operational workflows.", { first: true }),
  p("The researcher's personal experience managing a family retail business provided direct and compelling motivation for this study. Manual inventory records maintained through notebooks and spreadsheets consistently resulted in poor stock decisions, financial reconciliation difficulties, and an inability to determine the true profitability of individual product lines. This real-world exposure to the practical limitations of manual systems underscores the urgent and tangible need for an affordable, automated, and user-friendly inventory management solution tailored to the operational realities of Nigerian small businesses.", { first: true }),
  p("This study therefore focuses on the design and implementation of a web-based Smart Inventory Management System using Python and the Django framework, aimed specifically at addressing the limitations of traditional manual methods and improving efficiency, accuracy, and decision-making capability in inventory control and reporting for small and medium-scale enterprises.", { first: true }),
  ...blank(1),
  ...imgBox("1.1", "Conceptual Framework of the Smart Inventory Management System"),

  h2("1.2 Problem Statement"),
  p("The persistent reliance of many Nigerian SMEs on manual inventory techniques — including Microsoft Excel spreadsheets, physical logbooks, and paper-based stock cards — creates compounding operational inefficiencies that escalate in severity as businesses grow in size and transaction volume. The key problems motivating this research can be categorised across five interconnected dimensions.", { first: true }),
  h3("1.2.1 High Error Rates in Manual Data Entry and Record-Keeping"),
  p("Manual inventory systems are inherently vulnerable to transcription errors, arithmetic miscalculations, omissions during busy trading periods, and data duplication from parallel record-keeping across multiple books or spreadsheet files. Nemtajelai and Mbohwa (2016) report that manual systems generate significantly higher error rates than automated alternatives, as entries are made entirely by hand without automated validation. These errors cascade into inaccurate stock counts, incorrect financial calculations, and unreliable sales reports that business owners cannot confidently rely upon for strategic decisions. Agrawal and Smith (2020) further found that inventory inaccuracies in manual systems directly contribute to measurable financial losses and operational delays in small businesses.", { first: true }),
  h3("1.2.2 Absence of Real-Time Stock Visibility and Timely Alerts"),
  p("Manual systems rarely provide immediate visibility into current stock levels. Business owners typically only discover that a product has reached critically low levels during a physical stock count — an exercise that may only be conducted weekly or monthly in smaller enterprises. The absence of automated monitoring means that stockouts frequently occur before any corrective restocking action is taken, directly resulting in lost sales, customer disappointment, and reputational damage. Similarly, without automated reorder alerts, overstocking of slow-moving products persists unnoticed, locking up capital that could be deployed more productively elsewhere in the business (Wasp Barcode, 2013; Netsuite, 2022).", { first: true }),
  h3("1.2.3 Slow and Inadequate Analytical Reporting"),
  p("Generating meaningful business performance reports from manual inventory systems requires time-consuming manual data extraction, aggregation, and calculation — processes that are both error-prone and impractical for busy small business operators to conduct with sufficient regularity to be operationally useful. Without timely analytical reports on sales performance, stock movement trends, product profitability, and purchasing patterns, business owners lack the information necessary to identify best-selling items, discontinue underperforming products, negotiate effectively with suppliers, or plan seasonal inventory adjustments (Kim & Peterson, 2017; Oberholzer, 2021).", { first: true }),
  h3("1.2.4 Limited Concurrent Access and Scalability"),
  p("Spreadsheet-based manual systems are particularly constrained in multi-user environments where multiple staff members need to access and update inventory records simultaneously. Concurrent editing of shared spreadsheets frequently results in data conflicts, overwriting of recent entries, and loss of transaction history. As businesses grow, these limitations become increasingly severe and the gap between manual system capacity and actual operational requirements widens progressively, creating an urgent scalability problem that manual methods cannot resolve without fundamental technological change (Erameh & Odoh, 2021).", { first: true }),
  h3("1.2.5 Poor Purchasing Decisions and Financial Management"),
  p("Without reliable, timely, and analytically structured inventory data, purchasing decisions are frequently made on intuition, customer complaints, or physical shelf inspection rather than on systematic analysis of sales trends, stock turnover rates, and demand patterns. This results in chronically suboptimal purchasing — either buying too much of slow-moving stock or too little of high-demand items — that reduces profitability, increases holding costs, and generates avoidable waste from expired or obsolete goods. The absence of integrated profit analysis at the product level further prevents business owners from making informed decisions about pricing, promotions, and product mix optimisation.", { first: true }),
  p("These interconnected challenges collectively highlight the pressing need for a smart, web-based inventory management system that automates data capture and validation, ensures real-time stock visibility, generates timely analytical insights, and provides an intuitive interface accessible to non-technical SME operators. Such a system will directly address the documented limitations of manual methods and enhance efficiency, reliability, and decision-making quality in inventory management for Nigerian small businesses.", { first: true }),

  h2("1.3 Aim and Objectives of the Study"),
  h3("1.3.1 Aim"),
  p("The aim of this study is to design and implement a web-based Smart Inventory Management System that automates the processes of monitoring, controlling, and reporting inventory activities, thereby improving data accuracy, operational efficiency, and evidence-based decision-making in small and medium-scale business operations.", { first: true }),
  h3("1.3.2 Specific Objectives"),
  p("To achieve the stated aim, the following specific objectives guide the study:", { first: true }),
  num("To gather and analyse system requirements using established requirement-elicitation techniques including synthetic data analysis, structured literature review, and review of comparable existing systems."),
  num("To design a scalable, modular, web-based Smart Inventory Management System architecture that supports the efficient management of inventory items, sales transactions, supplier records, and analytical reporting."),
  num("To implement the system using Python and the Django framework with a PostgreSQL relational database, Celery asynchronous task processing, and a REST API, ensuring scalability, security, and reliable processing of inventory operations."),
  num("To test and evaluate the system against identified functional and non-functional requirements, validating performance, security, and data integrity under realistic business conditions using a Nigerian-context dataset."),

  h2("1.4 Justification of the Study"),
  p("Effective inventory management plays a crucial role in the operational success and financial sustainability of any business that deals with physical goods or products (OECD, 2021). However, many businesses — particularly small and medium-scale enterprises in Nigeria — continue to experience significant financial losses and operational disruptions arising directly from poor inventory control practices. These challenges consistently stem from inadequate record-keeping, the absence of real-time stock monitoring, and an inability to systematically analyse sales trends and customer demand patterns.", { first: true }),
  h3("1.4.1 Technical Justification"),
  p("Python and the Django framework represent a technically mature, battle-tested, and extensively documented combination for building scalable web applications. Django's built-in ORM, security middleware, authentication system, and administrative interface accelerate development while enforcing best-practice architectural patterns that ensure the system's long-term maintainability. The addition of PostgreSQL as the production database provides ACID-compliant transaction handling essential for accurate concurrent stock updates, while Celery with Redis enables the asynchronous background processing required for low-stock alerts without blocking the main user-facing web interface.", { first: true }),
  p("The Django Rest Framework (DRF) enables the construction of a versioned, JWT-secured REST API that future integrations — mobile applications, accounting software, e-commerce platforms — can consume without changes to the core system architecture. Chart.js provides client-side data visualisations that run entirely in the browser without server-side rendering overhead, contributing to a responsive and performant dashboard experience even on low-bandwidth connections typical of Nigerian SME environments.", { first: true }),
  h3("1.4.2 Operational Justification"),
  p("The researcher has personally experienced the operational limitations of manual inventory management while working in a family retail business. Stock decisions were consistently made without reliable data, financial reconciliation was time-consuming and error-prone, and the true profitability of individual product lines was impossible to determine without labour-intensive manual calculations. This direct personal exposure to the problem validates the operational need for the proposed solution and ensures that the system design is grounded in authentic real-world requirements rather than theoretical assumptions.", { first: true }),
  p("The system's design specifically addresses the operational realities of Nigerian SMEs: it requires no specialised hardware beyond a standard internet-connected device; it runs in a standard web browser without software installation; it provides a Glassmorphism user interface that is visually modern yet intuitive for users with limited digital literacy; and it is deployable on affordable cloud hosting platforms compatible with Docker containerisation.", { first: true }),
  h3("1.4.3 Economic Justification"),
  p("The economic case for a digital inventory management system is compelling for Nigerian SMEs. The costs of stockouts — lost sales, customer attrition, emergency restocking at premium prices — and the costs of overstocking — tied-up capital, increased holding costs, expired goods — together represent a significant and avoidable drain on SME profitability. Olowolaju and Mogaji (2024) demonstrated that SMEs in Lagos State implementing structured inventory management practices showed measurable improvements in profitability and operational efficiency relative to those relying on manual methods. The proposed system provides these benefits at a fraction of the cost of commercial enterprise inventory software, using exclusively open-source technologies with zero licensing fees.", { first: true }),

  h2("1.5 Scope and Limitations of the Study"),
  h3("1.5.1 Scope of the Study"),
  p("This study covers the complete design, implementation, testing, and evaluation of a web-based Smart Inventory Management System targeted at small and medium-scale enterprises. The specific functional scope encompasses the following areas:", { first: true }),
  num("Development of a web-based, role-differentiated interface allowing authorised Admin, Manager, and Staff users to perform all core inventory operations including adding, updating, viewing, and removing inventory items through a consistent and intuitive browser-based interface."),
  num("Implementation of a comprehensive sales processing module that records individual sale transactions, manages sale line items across multiple products per transaction, automatically adjusts stock quantities upon sale completion, and maintains a full auditable sales history."),
  num("Integration of an automated alert system implemented as asynchronous Celery background tasks that continuously monitors product stock levels against configurable reorder thresholds and triggers email notifications and dashboard alerts when stock falls below defined minimum quantities."),
  num("Generation of analytical reports and real-time dashboards providing insights into stock movements (Stock In, Stock Out, Adjustments), sales performance, category distribution, and profitability metrics to support evidence-based business decision-making."),
  num("Integration of a secure, normalised PostgreSQL relational database management system for persistent, ACID-compliant storage and retrieval of all inventory, sales, user, and alert data."),
  num("Provision of a versioned REST API (30+ endpoints at /api/v1/) secured with JWT authentication, enabling future integration with mobile applications or third-party business tools."),
  h3("1.5.2 Limitations of the Study"),
  num("Physical automation: The current version does not incorporate physical automation technologies such as RFID readers, IoT sensors, or barcode scanners. Stock additions and removals are entered manually by authorised staff through the web interface, though the system architecture has been designed to accommodate these integrations in future iterations."),
  num("Payment processing: This version does not include an integrated payment gateway or e-commerce module. Financial transaction processing beyond internal sales recording falls outside the current project scope due to time and regulatory constraints, though it is identified as a priority enhancement for future development."),
  num("Offline functionality: The system requires internet connectivity for access, as it operates as a web application hosted on a remote server. Offline operation mode has not been implemented in the current prototype."),
  num("Production deployment validation: While the system has been comprehensively tested in a controlled containerised environment, full live production deployment with real business users across extended periods falls outside the scope of this academic project."),

  h2("1.6 Significance of the Study"),
  p("The development of a web-based Smart Inventory Management System holds substantial practical and academic significance, particularly for the small and medium-scale business community in Nigeria that has historically lacked access to affordable, user-friendly inventory management tools.", { first: true }),
  h3("1.6.1 Small Business Owners"),
  p("The system enables business owners to monitor stock levels in real time, track all sales transactions with complete line-item detail, and receive automated alerts when products require restocking — without requiring manual stock counts or spreadsheet updates. The analytical dashboard delivers at-a-glance insights into the most critical business performance indicators, enabling owners to make faster and better-informed purchasing and pricing decisions. For businesses previously managing inventory entirely by hand, the transition to this system represents a transformative improvement in operational control and financial transparency.", { first: true }),
  h3("1.6.2 Store Managers and Employees"),
  p("The system substantially reduces the manual workload associated with data entry, stock reconciliation, and report preparation. The role-based interface ensures that each staff category sees only the functionality relevant to their responsibilities, reducing cognitive overload and training requirements. Automated stock adjustments upon sale processing eliminate the double-entry burden that characterises manual systems where sales records and stock records are maintained separately.", { first: true }),
  h3("1.6.3 Business Analysts and Decision Makers"),
  p("The analytical reports and dashboard visualisations generated by the system provide structured, timely insights into stock movement patterns, category performance distributions, sales trends, and profitability metrics. These data-driven insights support strategic planning, investment decisions, supplier negotiation, and marketing strategy in ways that manual data analysis cannot match for timeliness or reliability.", { first: true }),
  h3("1.6.4 Researchers and Software Developers"),
  p("This study contributes to the growing body of academic literature on smart business systems, web-based inventory automation, and digital transformation in developing economies. It provides a fully documented, tested, and openly available reference implementation of a Django-based inventory system that can serve as a foundation for future research into AI-driven forecasting, federated multi-branch inventory management, and IoT-integrated stock automation. The Nigerian-context dataset with Naira valuations also provides a culturally specific empirical basis for comparable future studies.", { first: true }),
  p("Collectively, the system's benefits are directly aligned with Nigeria's broader national digital transformation agenda and the global call for technology adoption to enhance SME competitiveness. By bridging the technological accessibility gap for small businesses, this project promotes accuracy, efficiency, and accountability in inventory operations and contributes to building a more digitally empowered small business sector.", { first: true }),
  ...blank(1),
  tbl(["Challenge", "Manual System", "Smart Inventory System"], [
    ["Data Accuracy", "Error-prone manual entry; no validation", "Automated validation; database constraints prevent invalid entries"],
    ["Real-Time Stock Visibility", "Not available; requires physical count", "Instant real-time dashboard with current stock quantities and status"],
    ["Automated Alerts", "Not available; stockouts discovered reactively", "Celery background tasks trigger alerts when stock reaches reorder level"],
    ["Analytical Reporting", "Manual, time-consuming calculations", "Automated reports and Chart.js visualisations generated on demand"],
    ["Concurrent Multi-User Access", "Limited; conflicts in shared spreadsheets", "Role-based access for multiple simultaneous users without conflicts"],
    ["Data Security", "No access control; any user can modify records", "RBAC enforced; password hashing; CSRF protection; audit trail"],
    ["Scalability", "Degrades with data volume and user growth", "PostgreSQL + Django ORM scales horizontally with business growth"],
    ["Hardware Requirements", "Basic PC; no internet needed", "Standard internet-connected device; no specialised hardware required"],
  ], [2200, 2800, 4360]),
  p("Table 2.1: Summary of Manual vs. Smart Inventory Management Challenges", { center: true, italic: true }),

  h2("1.7 Definition of Key Terms"),
  mixed([["Inventory: ", true], ["All goods, raw materials, finished products, and consumable items held by a business for production, distribution, or sale. Inventory constitutes one of the most significant current assets on an SME's balance sheet."]]),
  mixed([["Inventory Management: ", true], ["The systematic process of planning, monitoring, controlling, and optimising the levels, ordering, storage, and movement of stock within a business to ensure product availability while minimising associated holding costs."]]),
  mixed([["Smart Inventory Management System: ", true], ["A computer-based, web-accessible application that automates core inventory operations — including stock recording, monitoring, alerting, and reporting — with minimal manual intervention, using a relational database, business logic layer, and analytical dashboard."]]),
  mixed([["Web-Based System: ", true], ["A software application accessed and operated through a standard internet browser without requiring local installation on the user's device, enabling access from any internet-connected location on any compatible device."]]),
  mixed([["Automated Alert System: ", true], ["A background software process that continuously monitors specified data conditions — in this context, stock quantity levels relative to configurable reorder thresholds — and automatically triggers notifications when conditions are met."]]),
  mixed([["Reorder Point (ROP): ", true], ["The minimum stock quantity of a given product below which a purchase order should be initiated to prevent stockout. In this system, the reorder point is configurable per product through the threshold_level field."]]),
  mixed([["Role-Based Access Control (RBAC): ", true], ["A security paradigm in which system access rights and permitted operations are assigned according to predefined user roles (Admin, Manager, Staff), ensuring that each user can only access and modify information appropriate to their organisational function."]]),
  mixed([["Analytical Dashboard: ", true], ["An interactive, real-time visual summary of key operational performance indicators, typically combining numerical metric cards, time-series trend charts, and categorical distribution visualisations to enable rapid business performance assessment."]]),
  mixed([["SKU (Stock Keeping Unit): ", true], ["A unique alphanumeric identifier assigned to each distinct inventory item to facilitate precise tracking, searching, and management of individual products across all system operations."]]),
  mixed([["Glassmorphism: ", true], ["A contemporary UI design aesthetic characterised by frosted-glass visual effects, translucency, blur backdrops, and subtle border highlights that create a modern, premium appearance while maintaining functional clarity."]]),
  pb()
);

// ════════════════════════════════════════════════════
//  CHAPTER TWO
// ════════════════════════════════════════════════════
children.push(h1("CHAPTER TWO"), h1("LITERATURE REVIEW"));
children.push(
  h2("2.1 Conceptual Review"),
  h3("2.1.1 Inventory Management"),
  p("Inventory management involves the comprehensive planning, controlling, and monitoring of stock levels to ensure the availability of required items at the appropriate time and in the appropriate quantities, while simultaneously minimising holding costs and operational disruptions. Stevenson (2021) explains that effective inventory management helps organisations balance supply and demand by determining optimal stock quantities, timing procurement decisions appropriately, and maintaining accurate records of all stock movements. The field encompasses a range of strategic and operational decisions including demand forecasting, reorder quantity determination, supplier selection, storage optimisation, and performance reporting.", { first: true }),
  p("For SMEs, effective inventory management is especially important because poor stock control often leads directly to operational disruptions, reduced customer satisfaction, and compounding financial losses that smaller businesses with limited capital reserves are less able to absorb than larger enterprises. Studies consistently show that inefficient inventory processes contribute to stockouts that result in missed revenue, excess inventory that consumes working capital and generates carrying costs, and unnecessary procurement expenses from emergency restocking at non-negotiated prices (Afolayan et al., 2019; Olowolaju & Mogaji, 2024).", { first: true }),
  p("Wild (2017) emphasises that inventory must be monitored using structured management systems that enable consistent accuracy in ordering, receiving, and tracking items across all product categories and storage locations. More recent studies confirm that inventory management plays a critical role in sustaining competitive advantage and operational performance, particularly in sectors with high product turnover and thin profit margins where small improvements in stock efficiency translate directly into measurable profitability gains (Zeballos, Mendez & Seifert, 2018). A well-designed inventory management system supports business continuity, improves the speed and quality of decision-making, and enhances profitability — especially for small enterprises with limited resources and no dedicated supply chain management teams.", { first: true }),
  h3("2.1.2 Manual Inventory Systems"),
  p("Manual inventory systems rely on traditional approaches such as handwritten stock cards, physical ledger books, and spreadsheet files to track stock levels and record transactions. While commonly adopted by micro and small-scale enterprises due to their low initial cost and perceived simplicity, research consistently demonstrates that manual inventory processes generate high error rates and significant operational inefficiencies at scale. Nemtajelai and Mbohwa (2016) document that manual systems regularly produce inaccurate stock data because entries are completed entirely by hand, making them inherently vulnerable to transcription errors, omissions during peak trading periods, and miscalculations in running totals.", { first: true }),
  p("Beyond data accuracy concerns, manual record-keeping consumes significant staff time during stock counting, data entry, reconciliation, and report preparation — time that in an SME context is typically drawn from the same small pool of staff responsible for serving customers and managing operations (Munyaka & Yadavalli, 2022). Manual systems also fundamentally lack real-time stock visibility: stockout or overstock conditions are rarely detected until a physical count is conducted, which may occur days or weeks after the problem developed. By the time the issue is identified and corrective action taken, financial losses have already accumulated. Agrawal and Smith (2020) quantified that inventory inaccuracies in manual systems in SME contexts directly contribute to measurable financial losses through both missed sales from stockouts and capital wastage from overstocking. These documented limitations provide the empirical foundation for transitioning to digital, automated inventory systems.", { first: true }),
  h3("2.1.3 Web-Based Inventory Systems"),
  p("Web-based inventory systems are digital platforms accessible through standard internet browsers that allow organisations to record, track, and manage all stock information in real time from any internet-connected location. According to Erameh and Odoh (2021), web-based inventory systems directly address the most significant limitations of manual methods by providing centralised data storage with referential integrity, secure multi-user authentication, and automated stock quantity updates that eliminate the need for parallel manual record-keeping.", { first: true }),
  p("Chukwumuanya, Onwurah, and Ihueze (2024) highlight that web-based systems significantly improve stock visibility, reduce data-entry errors through automated validation, and enhance operational efficiency for small businesses transitioning from paper-based records. The centralised database architecture eliminates the data conflicts and version control problems that plague shared spreadsheet systems, while the browser-based access model requires no software installation and enables access from any device.", { first: true }),
  p("Web-based inventory solutions also substantially reduce the time spent on administrative tasks by providing automated calculations, intuitive search and filtering interfaces, and organised reporting features that would otherwise require manual data aggregation (Wibisono, Sofianti & Awibowo, 2016). Yurindra and Wijaya (2018) further emphasise that integrating decision-support features such as the Economic Order Quantity (EOQ) model into web platforms allows businesses to determine optimal reorder quantities more accurately and prevent stockouts more systematically. Overall, web-based inventory systems represent an accessible, affordable, and effective digital transformation pathway for modern small-scale enterprises seeking to improve their operational management without significant capital investment in hardware infrastructure.", { first: true }),
  h3("2.1.4 Smart and Automated Inventory Systems"),
  p("Smart or automated inventory systems refer to digital solutions that deploy technology-based tools — relational databases, rule-based automation engines, background task processors, and analytical reporting modules — to streamline the monitoring and control of inventory without requiring continuous manual intervention in routine processes. According to Ismail and Abdullah (2019), smart inventory systems reduce human involvement in repetitive operational tasks by automating stock quantity updates, reorder alert generation, and inventory tracking activities, thereby minimising the occurrence of human errors while improving the speed and consistency of inventory management operations.", { first: true }),
  p("Kumar and Ramasamy (2020) argue that automated inventory systems provide genuine real-time visibility into stock levels across all product categories simultaneously, enabling organisations to proactively avoid stock shortages, overstocking, and product waste before these conditions translate into financial losses. Beyond operational automation, smart systems integrate analytical functions capable of generating valuable performance insights including identification of fast-moving and slow-moving items, analysis of sales patterns and customer demand trends, and calculation of profitability metrics at the product and category level. This analytical dimension transforms inventory management from a reactive record-keeping function into a proactive business intelligence resource that directly supports strategic management decision-making (Oberholzer, 2021).", { first: true }),
  p("The World Bank (2021) emphasises that transitioning to digital inventory management systems is a key operational requirement for SMEs seeking to improve their competitiveness in an increasingly technology-driven business environment. Affordable, web-based smart systems — particularly those built on open-source frameworks such as Django — represent the most accessible pathway for this transition in the Nigerian SME context.", { first: true }),
  h3("2.1.5 Analytical Reporting in Inventory Management"),
  p("Analytical reporting in inventory management involves the systematic use of data analysis tools, aggregation queries, and visualisation techniques to evaluate stock movement patterns, sales trends, supplier performance, and overall business performance metrics. According to Waller and Fawcett (2013), data analytics enables businesses to interpret inventory patterns, forecast demand trends, and make informed strategic decisions that improve operational efficiency and reduce unnecessary costs. Effective analytical reporting transforms raw transaction data — individual stock additions, sales records, and adjustment entries — into meaningful, actionable insights that directly support management planning and resource allocation.", { first: true }),
  p("Kim and Peterson (2017) highlight that analytical tools embedded within inventory systems help organisations identify fast-moving and slow-moving items at a glance, assess profitability at the product and category level, and optimise stock levels based on historical sales performance data without requiring manual data extraction or calculation. These analytical capabilities are particularly essential for small businesses, which typically lack the dedicated finance or analytics staff resources to perform manual data analysis with sufficient frequency or depth to be operationally useful.", { first: true }),
  p("Oberholzer (2021) notes that analytical reporting embedded within inventory management systems — particularly visual dashboards featuring charts, trend lines, and summary cards — significantly strengthens managerial decision-making quality by simplifying the interpretation of complex inventory records. When business owners can view stock movement trends, category distributions, and sales performance metrics at a glance through an intuitive dashboard, they are better equipped to identify emerging issues and opportunities before they become costly problems.", { first: true }),

  h2("2.2 Theoretical Framework"),
  h3("2.2.1 Information Systems Theory (IST)"),
  p("Information Systems Theory (IST), as developed and refined by Laudon and Laudon (2020), provides the foundational theoretical framework explaining how digital information systems support, augment, and transform organisational operations, decision-making processes, and operational efficiency. IST posits that information systems function as integrated sociotechnical systems that process raw operational data into structured, timely information that supports human decision-making at all organisational levels. The theory emphasises that information systems improve accuracy by eliminating human calculation errors, automate repetitive data-processing activities to free human capacity for higher-value tasks, and integrate previously disconnected business functions — such as sales, purchasing, and stock management — into a coherent and consistent information environment.", { first: true }),
  p("In the specific context of inventory management, IST explains how a web-based system can replace the fragmented, error-prone manual processes of stock recording and reporting with a centralised, automated, and consistently accurate digital alternative. The theory directly supports each design decision in this study: the centralised PostgreSQL database implements IST's principle of unified data storage; the real-time dashboard implements IST's principle of timely information delivery; and the automated alert system implements IST's principle of exception-based management through information system monitoring.", { first: true }),
  ...blank(1),
  ...imgBox("2.1", "Technology Acceptance Model (TAM) Adapted for This Study"),
  h3("2.2.2 Technology Acceptance Model (TAM)"),
  p("The Technology Acceptance Model, originally formulated by Davis (1989) and subsequently refined through extensive empirical validation across diverse technology adoption contexts, provides a theoretical explanation of how individual users form intentions to adopt and consistently use new information system technologies. TAM posits that actual system usage is determined by users' behavioural intentions, which are in turn jointly determined by two primary cognitive beliefs: Perceived Usefulness (PU) — the degree to which a user believes that using the system will enhance their job performance; and Perceived Ease of Use (PEOU) — the degree to which a user believes that interacting with the system will require minimal cognitive effort.", { first: true }),
  p("In inventory management contexts involving SME operators, TAM has been empirically validated to explain adoption patterns effectively. Studies by Rahimi, Nadri, and Lotfollahzadeh (2020) demonstrate that SME owners and employees are substantially more likely to adopt and persistently use a new inventory system when it visibly improves their ability to complete their work (Perceived Usefulness) and when the interface is intuitive and requires minimal training to operate effectively (Perceived Ease of Use). Systems that score low on either dimension experience adoption resistance regardless of their technical capabilities.", { first: true }),
  p("TAM directly informed several critical design decisions in this study. The Glassmorphism user interface was selected specifically to maximise Perceived Ease of Use through intuitive navigation, clear visual hierarchy, and familiar interaction patterns. The dashboard KPI cards were designed to immediately demonstrate Perceived Usefulness by providing visible, actionable business insights on first login. The role-based interface ensures that each user type sees only the functionality relevant to their role, further reducing cognitive load and improving perceived ease of use for non-technical staff members.", { first: true }),
  h3("2.2.3 Systems Theory"),
  p("Systems Theory, originally formulated by von Bertalanffy (1968) as a transdisciplinary framework for understanding complex organisations, views any organisation as a set of interrelated and interdependent components that function as a unified whole to achieve shared objectives. The theory emphasises that changes in one component of a system inevitably affect other connected components, and that the performance of the whole system is determined by the quality of interactions between its parts rather than solely by the performance of individual components in isolation.", { first: true }),
  p("In the inventory management context, Systems Theory explains why inventory management cannot be treated in isolation from related business functions such as sales processing, purchasing, financial accounting, and customer service. The inventory system interacts continuously with sales operations (which reduce stock quantities), supplier management (which determines restocking timing and quantities), and financial management (which tracks the capital implications of stock decisions). A web-based inventory management system designed with Systems Theory as its theoretical foundation acts as a unified integration platform that maintains consistency and coherence across all these interconnected functions through a shared relational database and shared business logic layer (Erameh & Odoh, 2021).", { first: true }),
  ...blank(1),
  ...imgBox("2.2", "Systems Theory Applied to Inventory Management — Integration of Business Functions"),

  h2("2.3 Review of Related Works"),
  p("This section presents a structured review of existing academic research on web-based inventory management systems, with specific focus on highlighting each study's contributions, methodological approaches, identified strengths, documented limitations, and relevance to the current project. The review is organised chronologically and thematically to build a coherent picture of the state of the field and the gaps that this study addresses.", { first: true }),
  h3("2.3.1 Erameh and Odoh (2021)"),
  p("Erameh and Odoh (2021) developed and evaluated a web-based inventory control system for a small and medium-scale enterprise, demonstrating improved stock accuracy and substantially reduced manual paperwork relative to the existing manual system. Their system implemented multi-user access with centralised stock records accessible from any authorised device, which enhanced operational coordination and eliminated the data conflicts common to shared spreadsheet systems. The system was built using PHP and MySQL and provided basic CRUD operations for product management and stock tracking.", { first: true }),
  p("However, the system lacked advanced analytical features such as sales trend analysis over customisable time periods, product-level profitability reporting, and visual dashboard components accessible to non-technical business owners. The study also did not address role-based access control with defined privilege separation between administrative and operational users, leaving data integrity concerns unresolved in multi-user deployments. This study's primary contribution to the current work lies in demonstrating the fundamental viability of web-based inventory systems for SME applications while clearly identifying the analytical and security gaps that represent the core research opportunity addressed in the present project.", { first: true }),
  h3("2.3.2 Chukwumuanya, Onwurah and Ihueze (2024)"),
  p("Chukwumuanya, Onwurah, and Ihueze (2024) designed a web-based inventory management system that incorporated statistical forecasting using Autoregressive Moving Average (ARMA) models to support production planning and sales volume prediction. The system successfully improved forecasting accuracy and reduced stock imbalance episodes in the studied small businesses by providing mathematically grounded demand projections rather than relying on managerial intuition.", { first: true }),
  p("Despite these technical contributions, the forecasting module was complex and required statistical knowledge to configure and interpret correctly, creating a significant practical adoption barrier for small retail shop operators without quantitative backgrounds. The study also did not emphasise interface simplicity or the user experience requirements of non-technical business owners as a core design priority, resulting in a system better suited to data-literate analysts than to typical SME operators. The present study addresses these gaps through simple, automatically computed analytical dashboards, automated alerts that require no statistical configuration by users, and an intuitive Glassmorphism interface designed explicitly for non-technical operators.", { first: true }),
  h3("2.3.3 Wibisono, Sofianti and Awibowo (2016)"),
  p("Wibisono, Sofianti, and Awibowo (2016) developed a web-based material inventory control system for an automotive manufacturing company, demonstrating the value of centralised web-accessible systems in managing high-volume material stock in a structured industrial environment. Their system provided real-time access to material records, streamlined procurement documentation workflows, and improved visibility across multiple storage locations in a large manufacturing context.", { first: true }),
  p("The system's design, however, was highly adapted to the structured workflows and organised procurement processes of a large industrial organisation, making it substantially less applicable to small retail businesses that operate with simpler, more fluid processes and fewer formal procedures. The procurement workflows embedded in the system assumed procurement team structures, formal purchase order authorisation chains, and regular supplier delivery schedules that SMEs rarely follow. The present study draws from this work's demonstration of the power of centralised, integrated web systems while implementing a fundamentally simpler and more adaptable design philosophy appropriate to the SME target context.", { first: true }),
  h3("2.3.4 Soegoto and Palalungan (2020)"),
  p("Soegoto and Palalungan (2020) implemented a web-based inventory information system to digitise sales and stock transactions in a retail environment, confirming that web-based approaches successfully reduce manual recording errors and significantly enhance transaction traceability relative to paper-based systems. Their system demonstrated that basic inventory digitisation delivers measurable operational benefits even without advanced analytical or automation features.", { first: true }),
  p("However, the system lacked explicit role-based access control and the security measures required for reliable multi-user deployment in commercial environments. There were no privilege separation mechanisms between administrators and operational staff, meaning any authorised user could modify any record — a significant data integrity and accountability risk. The system also provided limited analytical reporting capabilities beyond basic transaction lists. The present study directly addresses these gaps through Django's built-in authentication system augmented with RBAC, CSRF protection, HSTS, and comprehensive audit trail logging.", { first: true }),
  h3("2.3.5 Afolayan et al. (2019)"),
  p("Afolayan and colleagues conducted a rigorous comparative analysis of inventory management techniques across multiple methodological approaches, documenting the challenges businesses face in selecting and consistently applying appropriate stock valuation and tracking methods. The study identified data inaccuracy from inconsistent manual recording practices and inefficient record-keeping as the primary contributors to poor inventory performance across the surveyed businesses.", { first: true }),
  p("Despite providing valuable empirical documentation of the inventory management problem space, the research was fundamentally theoretical and did not propose, design, or evaluate a practical technological solution for SMEs. The study supports the need for the current project by establishing the empirical evidence base for inventory management inefficiency in SME contexts while leaving open the design and implementation response that this project provides.", { first: true }),
  h3("2.3.6 Zeballos, Mendez and Seifert (2018)"),
  p("Zeballos, Mendez, and Seifert (2018) conducted a comprehensive systematic review of modern retail inventory management practices, identifying digital tracking technologies, advanced analytics platforms, and technology-driven demand forecasting as the defining characteristics of contemporary best-practice inventory management. While the review provides excellent documentation of sophisticated methods used in large retail chains with significant ICT budgets and dedicated supply chain teams, it explicitly acknowledges the severely limited adoption of these methods among SMEs due to their high implementation costs, technical complexity, and training requirements.", { first: true }),
  p("The study does not propose practical lightweight solutions suitable for small businesses with limited technical resources and non-technical operators. The present project directly addresses this gap by providing an affordable, web-based solution with essential analytics tailored specifically to SME requirements — delivering the core benefits of digital inventory management without the complexity and cost barriers that prevent SME adoption of enterprise-grade solutions.", { first: true }),
  h3("2.3.7 Kim and Peterson (2017)"),
  p("Kim and Peterson (2017) examined how data-driven optimisation approaches improve inventory decision-making quality and operational efficiency in business organisations. Their findings strongly emphasise the importance of systematic analytics in reducing demand uncertainty, improving the accuracy of stock forecasting, and enabling more confident procurement decisions. The study established that organisations with access to timely, structured analytical reporting consistently make better inventory decisions than those relying on intuition or informal observation.", { first: true }),
  p("However, the optimisation models and analytical approaches discussed in the study require substantial historical datasets and intermediate-level statistical knowledge to implement and interpret correctly, creating practical barriers for small business application. The present study draws on this work's fundamental insight — that analytics significantly improves inventory decision quality — while implementing simple, automatically generated analytical summaries and Chart.js visualisations that business owners can interpret without any quantitative training.", { first: true }),
  h3("2.3.8 Ismail and Abdullah (2019)"),
  p("Ismail and Abdullah (2019) investigated automation and real-time processing in modern inventory management systems, concluding that automation significantly reduces human error and consistently improves operational efficiency and throughput across all inventory management functions examined. Their study focused primarily on automated systems that rely on IoT sensors, RFID readers, and connected hardware devices for real-time stock monitoring — an approach that delivers powerful automation capabilities but at a hardware investment cost that places it firmly beyond the financial reach of most Nigerian SMEs.", { first: true }),
  p("This study highlights the absence of accessible automated systems that deliver automation benefits without requiring expensive IoT hardware infrastructure. The current project bridges this specific gap by offering automated low-stock monitoring and reorder alert notifications — core automation benefits — implemented through Celery background tasks and database-level threshold monitoring, entirely without requiring any physical hardware beyond the standard internet-connected devices the business already uses.", { first: true }),
  h3("2.3.9 Nemtajelai and Mbohwa (2016)"),
  p("Nemtajelai and Mbohwa (2016) conducted a detailed exploration of inventory management challenges in SMEs operating within developing economies, including Nigeria and South Africa, documenting inadequate ICT adoption rates, high error rates in manual record-keeping, inconsistent stock counting practices, and the absence of structured inventory control policies as the primary contributors to poor inventory performance. The study provided a rigorous empirical foundation for understanding the specific nature and magnitude of inventory management problems in the SME context of developing economies.", { first: true }),
  p("However, consistent with many diagnostic research studies, Nemtajelai and Mbohwa (2016) did not present a technological solution, implementation framework, or system design in response to the challenges they documented. The present study builds directly on this empirical foundation by proposing, designing, and implementing a web-based smart system that digitally resolves each of the specific challenges identified in the developing-economy SME context — inaccurate records, limited real-time visibility, poor reporting, and inadequate ICT tools.", { first: true }),
  h3("2.3.10 Yego and Nderui (2024)"),
  p("Yego and Nderui (2024) analysed the practical application of the Economic Order Quantity (EOQ) model in SME inventory management and found that many small businesses struggle to consistently apply even basic inventory management formulas due to limited quantitative knowledge, time constraints, and the absence of computational tools that perform the calculations automatically. The study identified the need for inventory management tools that embed decision-support features in accessible, automated forms rather than expecting operators to calculate and apply formulae manually.", { first: true }),
  p("This study did not, however, build or evaluate a practical system demonstrating the proposed approach. The current project responds to this gap by implementing an automated reorder-point alert system that functionally delivers the core benefit of the EOQ model — ensuring reorders are triggered at the appropriate stock level — without requiring any calculation or quantitative knowledge from the system user. The threshold_level field per inventory item operationalises the reorder point concept in a format that any business operator can understand and configure.", { first: true }),
  h3("2.3.11 Oberholzer (2021)"),
  p("Oberholzer (2021) demonstrated through empirical analysis that business analytics tools — specifically operational dashboards and data visualisation components — significantly influence and improve inventory management decision quality in small enterprises. The study established that visual representations of stock data, sales trends, and performance metrics enable business owners to identify patterns and make decisions that they would miss when reviewing raw transaction lists or manual calculation outputs. Despite these important findings, Oberholzer noted that such analytical tools are typically unavailable or unaffordable for small businesses without dedicated technical staff to develop and maintain them.", { first: true }),
  p("The present project directly addresses this documented gap by embedding professionally designed Chart.js analytical dashboards, including Stock Movement trend charts and Category Distribution doughnut charts, directly within the inventory management application as an integrated standard feature rather than an optional or separately purchased add-on.", { first: true }),
  h3("2.3.12 Waller and Fawcett (2013)"),
  p("Waller and Fawcett (2013) examined how data analytics and digital information systems reshape supply chain management and inventory control practices across the business spectrum. Their research established the fundamental importance of data-driven approaches in managing inventory complexity and provided strong evidence for the competitive advantages that systematic analytics deliver in inventory decision-making contexts.", { first: true }),
  p("The primary limitation of their analysis for the current study is its focus on large enterprises with access to substantial data volumes, dedicated analytics teams, and enterprise-grade technology infrastructure — conditions that fundamentally differ from the SME context. The significance of this work for the present study lies in validating the strategic importance of analytics in inventory management while highlighting the need for simplified, appropriately scaled analytical tools accessible to small businesses, which this project provides.", { first: true }),
  ...blank(1),
  tbl(["Study", "System Developed", "Strengths", "Limitations", "Relevance to Current Study"], [
    ["Erameh & Odoh (2021)", "PHP/MySQL web-based inventory", "Multi-user access; centralised records", "No analytics; no RBAC; limited security", "Validates web approach; reveals analytical gap"],
    ["Chukwumuanya et al. (2024)", "ARMA forecasting inventory system", "Improved forecasting accuracy", "Complex; not user-friendly for SMEs", "Highlights need for simple, automated reporting"],
    ["Wibisono et al. (2016)", "Industrial material inventory system", "Centralised, real-time access", "Designed for large industrial organisations", "Demonstrates integration value; not SME-suitable"],
    ["Soegoto & Palalungan (2020)", "Retail web inventory system", "Reduces errors; transaction traceability", "No RBAC; limited analytics; security gaps", "Justifies security and analytics additions"],
    ["Afolayan et al. (2019)", "None (theoretical study)", "Empirical documentation of SME challenges", "No software solution proposed", "Supports problem identification rationale"],
    ["Ismail & Abdullah (2019)", "IoT-based automated inventory", "Strong automation; real-time", "Expensive IoT hardware; not SME-accessible", "Justifies software-only automation approach"],
    ["Oberholzer (2021)", "None (empirical study)", "Validates analytics impact on decisions", "Tools unavailable/unaffordable for SMEs", "Supports dashboard and reporting integration"],
  ], [1500, 1800, 1900, 1900, 2260]),
  p("Table 2.2: Comparison of Web-Based Inventory Systems in Related Works", { center: true, italic: true }),

  h2("2.4 Research Gap"),
  p("A systematic review of the existing literature reveals that while considerable research has explored the design and implementation of inventory management systems, notable and addressable gaps persist — particularly in solutions targeted specifically at the operational and technological context of small and medium-scale businesses in Nigeria and comparable developing economies.", { first: true }),
  p("Many of the reviewed systems, including those of Erameh and Odoh (2021) and Soegoto and Palalungan (2020), focus primarily on digital record-keeping and basic stock update functionality but lack comprehensive analytical reporting features that support managerial decision-making beyond transaction viewing. Business owners using these systems can see current stock quantities but cannot easily identify performance trends, profitability by product category, or sales velocity patterns that would inform better purchasing and pricing decisions.", { first: true }),
  p("Other reviewed studies, including Chukwumuanya et al. (2024) and Kim and Peterson (2017), emphasise sophisticated forecasting and optimisation techniques that, while technically effective in their studied contexts, require statistical knowledge and configuration expertise that create insurmountable adoption barriers for non-technical SME operators. A consistent finding across the literature is the absence of systems that simultaneously deliver meaningful analytical capabilities and genuine ease of use for operators without quantitative or technical backgrounds.", { first: true }),
  p("Furthermore, several implementations reviewed were developed specifically for large industrial or commercial organisations with complex multi-stage procurement workflows (Wibisono et al., 2016; Waller & Fawcett, 2013), making them inherently unsuitable for SMEs that require simpler, more flexible, and more affordable solutions. Studies that explicitly acknowledge SME challenges (Nemtajelai & Mbohwa, 2016; Afolayan et al., 2019) provide valuable empirical documentation of inventory management problems but stop short of proposing, designing, or evaluating practical technological interventions.", { first: true }),
  p("Additionally, those studies that do advocate for automation (Ismail & Abdullah, 2019) rely on IoT sensors, RFID hardware, and connected devices that represent significant capital investments beyond the means of most Nigerian small businesses. The literature does not adequately address the substantial space for software-only automation solutions — using background task processing, database-level threshold monitoring, and scheduled automated email alerts — that deliver meaningful automation benefits without any hardware dependency beyond the internet-connected devices businesses already use.", { first: true }),
  ...blank(1),
  tbl(["Research Gap", "Description", "This Study's Response"], [
    ["Limited analytical reporting", "Existing SME-focused systems provide basic stock records but not comprehensive analytics", "Integrated Chart.js dashboard with KPI cards, stock movement trends, category distribution, and profitability summaries"],
    ["Poor interface usability", "Analytical systems are too complex for non-technical SME operators", "Glassmorphism UI with intuitive navigation, status badges, and role-specific views requiring minimal training"],
    ["No software-only automation", "Automation studies rely on expensive IoT hardware", "Celery + Redis background task automation for reorder alerts without any hardware dependency"],
    ["Weak security and access control", "SME-focused systems rarely implement proper RBAC or data protection", "Full RBAC (Admin/Manager/Staff), PBKDF2 hashing, CSRF protection, HSTS, and audit trail via transaction logs"],
    ["Not SME-contextualised for Nigeria", "Most implementations use non-Nigerian context data and pricing", "Nigerian Naira (₦) valuations, realistic Nigerian product and supplier names, local business context"],
    ["No concurrent-safe stock updates", "Spreadsheet and basic web systems fail under simultaneous transactions", "Database-level select_for_update() atomic locking eliminates race conditions in multi-user concurrent transactions"],
  ], [2000, 3400, 3960]),
  p("Table 2.3: Research Gaps and Proposed Solutions", { center: true, italic: true }),
  ...blank(1),
  p("Given these documented gaps, this study designs and implements a web-based Smart Inventory Management System using Django and PostgreSQL that specifically provides: comprehensive analytical reports including stock movement, sales patterns, and profit summaries; simple and intuitive interfaces requiring minimal training for SME operators; automated reorder alerts without relying on IoT hardware; secure role-based access with a centralised database ensuring data accuracy; and full contextualisation to the Nigerian SME environment through Naira-valued datasets and locally relevant product data.", { first: true }),
  pb()
);

// ════════════════════════════════════════════════════
//  CHAPTER THREE
// ════════════════════════════════════════════════════
children.push(h1("CHAPTER THREE"), h1("SYSTEM DESIGN AND METHODOLOGY"));
children.push(
  h2("3.1 Overview"),
  p("This chapter presents the complete system design and methodology underpinning the development of the web-based Smart Inventory Management System. It describes the software development methodology adopted, the methods of data collection and system analysis employed, the functional and non-functional requirements specification, and the full logical and physical design of the system. The chapter presents architectural design decisions, UML diagrams illustrating user interactions and system workflows, the detailed database schema, program module specifications, and system control mechanisms. Together, these components form the comprehensive blueprint upon which the system was implemented using Python and the Django web framework with a PostgreSQL 15 relational database backend.", { first: true }),

  h2("3.2 Methodology"),
  p("The development of the Smart Inventory Management System adopted the Agile Software Development Methodology, specifically the Scrum framework. Agile methodologies are widely adopted for web-based application development because they support iterative, incremental delivery, continuous stakeholder feedback integration, and rapid adaptation to evolving requirements — all characteristics highly relevant to a system whose requirements were refined through ongoing review of comparable systems and literature findings (Azanha, Tiradentes Terra Argoud & Camargo Junior, 2017).", { first: true }),
  p("In Scrum, development activities are organised into short, time-boxed iterations called sprints, each producing a potentially deployable increment of the system. This approach allowed the inventory system's features to be designed, implemented, and reviewed in manageable increments, ensuring that each functional module was fully working before the next was begun. Empirical studies confirm that Scrum improves software quality by promoting transparency through regular sprint reviews, continuous inspection of delivered functionality, and rapid adaptation when defects or requirement mismatches are identified (Alami & Krancher, 2022; Šmite et al., 2023).", { first: true }),
  h3("3.2.1 Sprint Structure"),
  p("The development was organised into five structured sprints, each focused on a specific system layer or functional domain:", { first: true }),
  num("Sprint 1 — Foundation and Authentication: Django project scaffolding, custom user model with RBAC, login/logout views, and base template system with dark mode support."),
  num("Sprint 2 — Inventory Core: Item, Category, and Supplier models with full CRUD; paginated list views with search and filter; status tag logic (Optimal, Low, Out)."),
  num("Sprint 3 — Operations and Automation: StockTransaction model; atomic transaction processing with select_for_update(); Celery + Redis integration; low-stock alert background task."),
  num("Sprint 4 — REST API and Dashboard: DRF API viewsets for all core models (30+ endpoints) with JWT permissions; Chart.js dashboard with KPI cards, stock movement bar chart, and category doughnut chart."),
  num("Sprint 5 — Testing, Optimisation, and Deployment: 62 Pytest cases covering all modules; SQL-level ORM aggregation optimisation; Docker multi-container compose configuration; Makefile orchestration."),

  h2("3.3 System Analysis"),
  h3("3.3.1 Method of Data Collection"),
  p("Given the research context of a student-led implementation project and the logistical constraints of primary data collection from active business owners during trading hours, synthetic data were generated to simulate representative responses typically obtainable from business owners, sales attendants, and inventory personnel in small Nigerian retail shops. The synthetic dataset was constructed through a rigorous methodology: baseline patterns were derived from documented challenges of manual inventory management in Nigerian SME literature; realistic user expectations were drawn from the comparative analysis of related works; and specific data characteristics — product categories, pricing in Naira, supplier structures, and transaction patterns — were modelled on observable practices in Nigerian retail environments.", { first: true }),
  p("This synthetic dataset, equivalent to 38 valid representative responses, covered the following key aspects of current and desired inventory management practice: current inventory recording methods (stock cards, notebooks, spreadsheets); frequency and accuracy of stock counting procedures; challenges experienced with stockouts and overstocking; level of existing ICT adoption and digital literacy among staff; desired system features and interface preferences; and alert and reporting requirements for effective decision support.", { first: true }),
  h3("3.3.2 Key Findings from Data Analysis"),
  p("Analysis of the synthetic dataset revealed several important patterns consistent with documented real-world manual inventory management challenges in the Nigerian SME context. A substantial majority of simulated respondents reported that stock updates were recorded manually using notebooks or Excel spreadsheets, resulting in frequent lost records, inaccurate running totals, and difficulty reconciling sales records with physical stock counts at the end of trading periods.", { first: true }),
  p("Delays in identifying when stock required replenishment were consistently reported as a major operational issue, with stockouts frequently discovered only when customers requested unavailable products — at which point the sales opportunity had already been lost. Many respondents also reported significant difficulty in generating management reports such as profit summaries, stock valuations, and sales performance analyses, as these required time-consuming manual calculations that were rarely completed with sufficient frequency to be operationally useful.", { first: true }),
  p("Desired system features identified in the analysis included: automated notifications when stock reaches reorder thresholds; straightforward product addition and removal without technical knowledge; sales recording with automatic stock adjustment; and analytical report generation without requiring manual calculation. These findings directly informed the functional requirements specification and design priorities of the implemented system.", { first: true }),
  h3("3.3.3 Functional Requirements"),
  p("Based on the findings from data analysis and the review of related works, the following functional requirements define what the Smart Inventory Management System must do:", { first: true }),
  ...blank(1),
  tbl(["ID", "Functional Requirement", "Priority", "User Role"], [
    ["FR-01", "User Authentication: Secure login and session management for all system users", "Critical", "All roles"],
    ["FR-02", "Add New Inventory Items: Create product records with name, SKU, category, supplier, cost price, selling price, quantity, and reorder threshold", "Critical", "Admin, Manager"],
    ["FR-03", "Update Inventory Items: Modify existing product information and adjust stock quantities", "Critical", "Admin, Manager"],
    ["FR-04", "Process Sales Transactions: Record sales with multiple line items per transaction; automatically reduce stock quantities upon sale", "Critical", "Manager, Staff"],
    ["FR-05", "Delete Inventory Items: Remove obsolete or discontinued products from the system", "High", "Admin"],
    ["FR-06", "View Transaction History: Access complete, timestamped audit trail of all stock movements with type classification (In/Out/Adjust)", "High", "Admin, Manager"],
    ["FR-07", "Automated Reorder Alerts: Background task monitoring triggering email and dashboard alerts when stock falls below threshold_level", "Critical", "System (auto)"],
    ["FR-08", "Search and Filter Items: Locate products by name, SKU, category, or stock status through real-time search", "High", "All roles"],
    ["FR-09", "Analytical Dashboard: Real-time KPI cards and Chart.js visualisations showing stock movement trends, category distributions, and key metrics", "High", "Admin, Manager"],
    ["FR-10", "Role-Based Access Control: System access and operations restricted by user role (Admin, Manager, Staff) with no privilege escalation", "Critical", "Admin"],
    ["FR-11", "Supplier Management: Create and maintain supplier records with contact information linked to inventory items", "Medium", "Admin, Manager"],
    ["FR-12", "REST API Endpoints: 30+ versioned JWT-secured API endpoints at /api/v1/ for all core business logic", "Medium", "API clients"],
  ], [700, 4000, 1000, 1860]),
  p("Table 3.1: Functional Requirements of the Smart Inventory Management System", { center: true, italic: true }),
  h3("3.3.4 Non-Functional Requirements"),
  tbl(["ID", "Non-Functional Requirement", "Specification"], [
    ["NFR-01", "Usability", "Interface must be operable with minimal training; Glassmorphism design for visual clarity; role-specific views reducing cognitive overload"],
    ["NFR-02", "Performance", "Dashboard must load with sub-second response times using SQL-level ORM aggregations; concurrent transactions must complete without delays or data loss"],
    ["NFR-03", "Security", "PBKDF2 SHA256 password hashing; CSRF protection on all state-changing requests; HSTS enforcement; JWT for API authentication; no privilege escalation possible"],
    ["NFR-04", "Reliability", "100% pass rate on all Pytest cases; atomic transaction processing prevents partial updates; Celery Beat scheduled tasks must execute without manual intervention"],
    ["NFR-05", "Maintainability", "Modular Django app structure with clear separation of concerns; documented codebase; Docker containerisation for consistent deployment environments"],
    ["NFR-06", "Scalability", "PostgreSQL with connection pooling supports growing data volumes; horizontal scaling supported via containerised architecture; paginated list views handle high item counts"],
    ["NFR-07", "Compatibility", "System must function on Chrome, Firefox, Safari, and Edge; responsive Bootstrap layout supports desktop and tablet viewports"],
    ["NFR-08", "Data Integrity", "Foreign key constraints enforce referential integrity; select_for_update() prevents race conditions; input validation prevents negative stock or invalid data formats"],
  ], [700, 2200, 6460]),
  p("Table 3.2: Non-Functional Requirements", { center: true, italic: true }),

  h2("3.4 System Design"),
  h3("3.4.1 Logical Design Overview"),
  p("The logical design translates the identified requirements into a structured blueprint describing how the system's components interact to deliver all specified functionality. Object-Oriented Analysis and Design (OOAD) principles guide the modelling process, with UML diagrams representing user interactions, system workflows, object structures, and data relationships at an appropriate level of abstraction to guide implementation in Python and Django.", { first: true }),
  h3("3.4.1.1 System Architecture — Three-Tier Design"),
  p("The Smart Inventory Management System adopts a three-tier architecture that provides clear separation of concerns across three independently maintainable layers, each responsible for a distinct aspect of system functionality:", { first: true }),
  bl("Presentation Layer: The user interface is implemented using Django's template engine with HTML5, CSS3, and Bootstrap 5. Custom Glassmorphism styling is applied through CSS variables and dynamic class assignments. JavaScript handles asynchronous UI interactions including real-time search debouncing and Chart.js data visualisation rendering. The presentation layer communicates exclusively with the application layer through HTTP requests and Django template rendering — it contains no direct database access or business logic."),
  bl("Application Layer: Django 4.x serves as the application framework implementing the Model-View-Template (MVT) architectural pattern — Django's functional equivalent of the standard Model-View-Controller pattern. All business rules are encoded in this layer: authentication and session management, inventory CRUD validation, sales processing logic, stock quantity adjustment calculations, reorder threshold checking, and report data aggregation. Background tasks (Celery workers) also operate within this layer, executing asynchronously without blocking the web server."),
  bl("Data Layer: PostgreSQL 15 provides the production relational database backend, accessed exclusively through Django's SQLAlchemy-powered ORM rather than raw SQL queries. The normalised relational schema enforces referential integrity through foreign key constraints, prevents invalid data through field-level database constraints, and supports ACID-compliant transaction processing for reliable concurrent stock updates."),
  ...blank(1),
  ...imgBox("3.1", "Three-Tier System Architecture — Presentation, Application, and Data Layers"),
  h3("3.4.1.2 Use Case Diagram"),
  p("The use case diagram identifies the system's primary actors and their interactions with core system functionality within the system boundary. Four actors interact with the Smart Inventory Management System: Admin, Store Manager, Staff, and Supplier (external actor). The Admin actor has full system access including user management, system settings, all inventory operations, and access to audit logs. The Store Manager has access to all inventory operations, sales processing, alert configuration, and report generation. Staff have access to inventory viewing, basic sales processing, and stock-level monitoring. The Supplier is an external actor whose records are maintained within the system but who does not directly interact with the application interface.", { first: true }),
  ...blank(1),
  ...imgBox("3.2", "Use Case Diagram — Smart Inventory Management System"),
  h3("3.4.1.3 UML Class Diagram"),
  p("The UML class diagram illustrates the core entities of the Smart Inventory Management System, their attributes, methods, and the relationships between them. The primary classes are: User (managing authentication and role assignment), Category (classifying inventory items), Supplier (recording supplier information), Item (the central inventory entity linking to Category and Supplier), StockTransaction (recording all stock movements with atomic processing), Sale (recording sales transactions), SaleItem (representing individual line items within a sale), and Alert (representing low-stock notifications generated by background monitoring tasks). The class diagram reflects the normalised database schema and the relationships enforced through foreign keys.", { first: true }),
  ...blank(1),
  ...imgBox("3.3", "UML Class Diagram — Core Entities, Attributes, Methods, and Relationships"),
  h3("3.4.1.4 Activity Diagram — Stock Alert Notification Workflow"),
  p("The activity diagram models the complete workflow for the automated stock alert notification process, which is one of the system's most operationally significant features. The workflow begins when the business owner or administrator sets a reorder threshold level for a product through the inventory management interface. The system's Celery Beat scheduler triggers the check_low_stock_levels() background task at defined intervals without requiring manual activation. The task queries the database for all items where quantity is less than or equal to the threshold_level field. If low-stock items are found, the task constructs a structured email notification listing each item by name, SKU, and remaining quantity, and dispatches it to the configured administrator email address. The alert event is simultaneously logged in the alerts database table and a dashboard notification badge is updated to reflect the new alert count. If no items are below threshold, the task completes silently and is rescheduled for the next execution cycle.", { first: true }),
  ...blank(1),
  ...imgBox("3.4", "Activity Diagram — Automated Stock Alert Notification Workflow"),

  h3("3.4.2 Physical Design"),
  h3("3.4.2.1 System Module Descriptions"),
  tbl(["Module", "Django App", "Primary Functions"], [
    ["Authentication & User Management", "accounts", "Custom user model (CustomUser); RBAC (Admin/Manager/Staff); login/logout views; profile management; privilege-escalation prevention; PBKDF2 password hashing"],
    ["Inventory Management", "inventory", "Item CRUD (create, read, update, delete); Category management; Supplier records; SKU generation; stock status classification (Optimal/Low/Out); paginated list views with search and filter"],
    ["Operations & Stock Transactions", "operations", "StockTransaction model; atomic stock-in/stock-out/adjustment processing using select_for_update() and F() expressions; transaction history view; concurrent transaction safety"],
    ["Automated Alerts", "alerts", "Celery background task (check_low_stock_levels); Redis message broker integration; email alert dispatch via Django mail; dashboard alert badge; alert status management (Unread/Resolved)"],
    ["REST API", "api (via DRF)", "30+ versioned endpoints at /api/v1/; JWT authentication; IsAdminUser and IsManagerOrAdmin permission classes; ItemViewSet, TransactionViewSet, UserViewSet; OpenAPI schema"],
    ["Analytical Dashboard", "dashboard", "Real-time KPI cards (Total Items, Total Quantity, Low Stock Count, Transactions); Chart.js Stock Movement bar chart; Category Distribution doughnut chart; 7-day and 30-day trend calculations"],
    ["Reports", "reports", "Sales performance summaries; stock movement analysis; profitability by product and category; scheduled daily report generation via Celery Beat"],
  ], [1200, 1600, 6560]),
  p("Table 3.3: System Module Descriptions and Programming Structure", { center: true, italic: true }),

  h3("3.4.2.2 Database Design — Normalised Relational Schema"),
  p("The database is implemented using PostgreSQL 15 with a normalised relational design that enforces data integrity through foreign key relationships, unique constraints, check constraints, and appropriate field-level validation. The following tables constitute the core database schema:", { first: true }),
  ...blank(1),
  p("Table 3.4: Database Table — accounts_customuser", { bold: true }),
  tbl(["Field", "Type", "Constraints", "Description"], [
    ["id", "INT", "PRIMARY KEY, Auto-increment", "Unique user identifier"],
    ["username", "VARCHAR(50)", "UNIQUE, NOT NULL", "Login credential"],
    ["email", "VARCHAR(150)", "UNIQUE, NOT NULL", "Email address for notifications"],
    ["password", "VARCHAR(128)", "NOT NULL", "PBKDF2 SHA256 hashed password"],
    ["role", "VARCHAR(20)", "CHECK IN ('ADMIN','MANAGER','STAFF')", "User access category"],
    ["first_name", "VARCHAR(100)", "NOT NULL", "User's first name"],
    ["last_name", "VARCHAR(100)", "NOT NULL", "User's last name"],
    ["is_active", "BOOLEAN", "DEFAULT TRUE", "Account active status"],
    ["date_joined", "DATETIME", "AUTO NOW ADD", "Account creation timestamp"],
  ], [1500, 1200, 2500, 4160]),
  ...blank(1),
  p("Table 3.5: Database Table — inventory_category", { bold: true }),
  tbl(["Field", "Type", "Constraints", "Description"], [
    ["id", "INT", "PRIMARY KEY", "Unique category identifier"],
    ["title", "VARCHAR(100)", "UNIQUE, NOT NULL", "Category name (e.g., Electronics, Office Supplies)"],
    ["description", "TEXT", "NULLABLE", "Optional category description"],
    ["created_at", "DATETIME", "AUTO NOW ADD", "Record creation timestamp"],
  ], [1500, 1200, 2500, 4160]),
  ...blank(1),
  p("Table 3.6: Database Table — inventory_supplier", { bold: true }),
  tbl(["Field", "Type", "Constraints", "Description"], [
    ["id", "INT", "PRIMARY KEY", "Unique supplier identifier"],
    ["name", "VARCHAR(100)", "NOT NULL", "Supplier company name"],
    ["contact_email", "VARCHAR(254)", "UNIQUE, NULLABLE", "Primary contact email"],
    ["phone", "VARCHAR(20)", "NULLABLE", "Contact phone number"],
    ["address", "TEXT", "NULLABLE", "Physical address"],
    ["created_at", "DATETIME", "AUTO NOW ADD", "Record creation timestamp"],
  ], [1500, 1200, 2500, 4160]),
  ...blank(1),
  p("Table 3.7: Database Table — inventory_item (Central inventory entity)", { bold: true }),
  tbl(["Field", "Type", "Constraints", "Description"], [
    ["id", "INT", "PRIMARY KEY", "Unique item identifier"],
    ["name", "VARCHAR(200)", "NOT NULL", "Product name"],
    ["sku", "VARCHAR(50)", "UNIQUE, NOT NULL", "Stock Keeping Unit code"],
    ["category_id", "INT", "FK → inventory_category(id)", "Product category reference"],
    ["supplier_id", "INT", "FK → inventory_supplier(id), NULLABLE", "Primary supplier reference"],
    ["unit_price", "DECIMAL(10,2)", "NOT NULL, CHECK ≥ 0", "Selling price in NGN"],
    ["quantity", "INT", "NOT NULL, DEFAULT 0, CHECK ≥ 0", "Current available stock"],
    ["threshold_level", "INT", "NOT NULL, DEFAULT 10, CHECK ≥ 0", "Reorder alert trigger level"],
    ["description", "TEXT", "NULLABLE", "Product description"],
    ["created_at", "DATETIME", "AUTO NOW ADD", "Record creation timestamp"],
    ["updated_at", "DATETIME", "AUTO NOW", "Last modification timestamp"],
  ], [1500, 1200, 2500, 4160]),
  ...blank(1),
  p("Table 3.8: Database Table — operations_stocktransaction", { bold: true }),
  tbl(["Field", "Type", "Constraints", "Description"], [
    ["id", "INT", "PRIMARY KEY", "Unique transaction identifier"],
    ["item_id", "INT", "FK → inventory_item(id)", "Item affected by transaction"],
    ["user_id", "INT", "FK → accounts_customuser(id)", "Staff member who initiated the transaction"],
    ["transaction_type", "VARCHAR(20)", "CHECK IN ('IN','OUT','ADJUSTMENT')", "Direction and type of stock movement"],
    ["quantity_changed", "INT", "NOT NULL, CHECK > 0", "Quantity added, removed, or adjusted"],
    ["quantity_before", "INT", "NOT NULL", "Stock level immediately before transaction"],
    ["quantity_after", "INT", "NOT NULL", "Stock level immediately after transaction"],
    ["notes", "TEXT", "NULLABLE", "Optional transaction notes or reason"],
    ["timestamp", "DATETIME", "AUTO NOW ADD", "Exact time of transaction"],
  ], [1500, 1200, 2500, 4160]),
  ...blank(1),
  p("Table 3.9: Database Table — alerts", { bold: true }),
  tbl(["Field", "Type", "Constraints", "Description"], [
    ["id", "INT", "PRIMARY KEY", "Unique alert identifier"],
    ["product_id", "INT", "FK → inventory_item(id)", "Item that triggered the alert"],
    ["triggered_at", "DATETIME", "AUTO NOW ADD", "Date and time alert was generated"],
    ["status", "VARCHAR(20)", "CHECK IN ('UNREAD','RESOLVED')", "Current alert investigation status"],
    ["quantity_at_trigger", "INT", "NOT NULL", "Stock quantity at the time alert was triggered"],
    ["resolved_by_id", "INT", "FK → accounts_customuser(id), NULLABLE", "User who resolved the alert"],
    ["resolved_at", "DATETIME", "NULLABLE", "Timestamp of alert resolution"],
  ], [1500, 1200, 2500, 4160]),
  ...blank(1),
  ...imgBox("3.5", "Entity-Relationship Diagram — Full Database Schema with Relationships"),
  h3("3.4.2.3 System Controls"),
  tbl(["Control Type", "Implementation", "Purpose"], [
    ["Authentication Control", "Django's built-in authentication with custom CustomUser model; session-based login required for all views", "Ensures only authorised users can access any system functionality"],
    ["Role-Based Access Control", "Custom permission decorators checking user.role; IsManagerOrAdmin and IsAdminUser DRF classes", "Enforces privilege separation: Staff cannot manage users; only Managers/Admins can modify inventory"],
    ["Privilege Escalation Prevention", "Profile edit form explicitly excludes role field; server-side role verification on every request", "Prevents users from modifying their own role through profile editing or API manipulation"],
    ["Atomic Stock Processing", "select_for_update() database lock + F() expression updates wrapped in transaction.atomic()", "Eliminates race conditions when multiple users process transactions simultaneously"],
    ["Input Validation", "Django form validation + model-level constraints (CHECK quantity ≥ 0); API Pydantic-equivalent serialisers", "Prevents invalid data (negative stock, blank required fields, invalid SKUs) from entering the database"],
    ["Password Security", "PBKDF2 SHA256 hashing via Django's password hasher; configurable work factor", "Ensures stored passwords cannot be retrieved or reverse-engineered from database"],
    ["CSRF Protection", "Django CSRF middleware enabled globally; POST-only logout enforced", "Prevents Cross-Site Request Forgery attacks on state-changing form submissions"],
    ["API Authentication", "JWT (JSON Web Token) via DRF Simple JWT; 60-minute access token expiry; refresh token rotation", "Secures all REST API endpoints against unauthorised programmatic access"],
    ["Audit Trail", "All stock changes recorded in operations_stocktransaction with user_id, quantity_before, quantity_after, timestamp", "Provides complete, tamper-evident audit trail of all stock movements for accountability"],
  ], [1800, 3400, 4160]),
  p("Table 3.10: System Controls Implemented", { center: true, italic: true }),
  pb()
);

// ════════════════════════════════════════════════════
//  CHAPTER FOUR
// ════════════════════════════════════════════════════
children.push(h1("CHAPTER FOUR"), h1("RESULTS AND INTERPRETATION"));
children.push(
  h2("4.1 Introduction"),
  p("This chapter presents the comprehensive results obtained from the design, implementation, testing, and evaluation of the web-based Smart Inventory Management System. It documents the complete technology stack employed in system construction, describes each functional module implemented, details the database schema and dataset characteristics used for validation, presents the system's user interfaces with contextual descriptions, and provides a rigorous analysis and interpretation of performance, security, and functional test results against the requirements specified in Chapter Three.", { first: true }),
  p("The implemented system represents an enterprise-grade web application built on Python 3.11+ and Django 4.x, featuring: 30+ versioned REST API endpoints secured with JWT authentication; a PostgreSQL 15 relational database with atomic concurrent transaction processing; an asynchronous Celery + Redis task queue for non-blocking background alert processing; a Glassmorphism user interface with Chart.js real-time analytical visualisations; and a Docker + Docker Compose containerised deployment architecture enabling consistent, one-command application startup across development and production environments.", { first: true }),

  h2("4.2 Development Tools"),
  p("The system was constructed using a modern, scalable, and production-validated technology stack selected for performance, security, developer community support, and suitability for the Nigerian SME deployment context.", { first: true }),
  ...blank(1),
  tbl(["Category", "Technology", "Version", "Selection Rationale"], [
    ["Backend Language", "Python", "3.11+", "Readability, extensive library ecosystem, strong async capabilities, ORM maturity"],
    ["Web Framework", "Django", "4.x", "MVT architecture, built-in ORM, authentication, admin, CSRF, scalable patterns"],
    ["REST API", "Django Rest Framework (DRF)", "3.x", "Serialisers, viewsets, JWT integration, automatic browsable API"],
    ["Database", "PostgreSQL", "15", "ACID compliance, advanced connection pooling, CHECK constraints, JSONB support"],
    ["Task Queue", "Celery", "5.x", "Asynchronous background task execution; prevents web server blocking"],
    ["Message Broker", "Redis", "7", "High-performance in-memory message broker for Celery task routing"],
    ["Frontend", "HTML5, CSS3, Bootstrap 5", "Latest", "Responsive grid, component library, progressive enhancement"],
    ["UI Design", "Glassmorphism CSS", "Custom", "Modern frosted-glass aesthetic; dark mode via CSS variables and localStorage"],
    ["Data Visualisation", "Chart.js", "Latest", "Browser-side charting; bar charts for stock movement, doughnut for categories"],
    ["Containerisation", "Docker + Docker Compose", "Latest", "Consistent environments; multi-service orchestration (web, db, redis, celery)"],
    ["Testing", "Pytest + Factory Boy", "Latest", "Isolated model and view testing; factory-based test data generation"],
    ["CI/CD", "GitHub Actions", "Latest", "Automated test execution on push and pull requests"],
    ["IDE", "Visual Studio Code", "Latest", "Python, Django, Docker, and ESLint extensions"],
    ["Version Control", "Git / GitHub", "Latest", "Iterative development tracking; collaboration and backup"],
  ], [1500, 2000, 1000, 5060]),
  p("Table 4.1: Development Tools and Technology Stack", { center: true, italic: true }),
  ...blank(1),
  p("Note on Database Consistency: The system consistently uses PostgreSQL 15 as the relational database backend in all deployment configurations. While SQLite is available as a lightweight Django default database for rapid local development without Docker, the production system, the Docker Compose configuration, and all test evaluations presented in this chapter use PostgreSQL 15 exclusively. All database schema descriptions, constraint implementations, and performance metrics reported in this study refer to the PostgreSQL 15 deployment. References to SQLite in earlier design documentation refer only to the optional standalone development environment and not to the implemented production system.", { italic: true, first: true }),

  h2("4.3 System Modules and Functional Components"),
  h3("4.3.1 Security and Authentication Module (accounts app)"),
  p("The authentication module provides the security foundation for all other system components through Django's built-in authentication framework augmented with custom role-based access control. The CustomUser model extends Django's AbstractUser, adding a role field constrained to ADMIN, MANAGER, or STAFF values through a database-level CHECK constraint. This role field governs all privilege decisions throughout the system.", { first: true }),
  p("Role-Based Access Control is enforced through custom decorator functions applied to all view functions, verifying the authenticated user's role before any business logic executes. Django Rest Framework permission classes (IsAdminUser, IsManagerOrAdmin) enforce equivalent controls at the API level. A critical security property of the implementation is privilege escalation prevention: the profile edit form and API serialiser explicitly exclude the role field, making it impossible for any user — including Admins — to elevate their own role through the standard user interface. The role can only be set during account creation by an existing Admin.", { first: true }),
  p("Additional security protocols implemented include: HTTP Strict Transport Security (HSTS) enforcing HTTPS-only connections; SECURE_CONTENT_TYPE_NOSNIFF preventing MIME-type sniffing attacks; strict CSRF protection on all POST-based state-changing requests including logout; PBKDF2 SHA256 password hashing with a configurable work factor providing computational resistance to brute-force attacks; and session management with configurable timeout periods.", { first: true }),
  h3("4.3.2 Inventory Management Module (inventory app)"),
  p("The inventory module provides comprehensive CRUD operations for the three core inventory entities: Items, Categories, and Suppliers. Item management supports creation with all required fields — name, SKU, category, supplier, unit price, quantity, threshold level, and description — along with update and soft-delete functionality. All list views implement server-side pagination to efficiently handle high item counts without loading full datasets into memory.", { first: true }),
  p("A custom JavaScript search debouncing mechanism in the list view template delays the server-side search request by 300 milliseconds after the user stops typing, reducing unnecessary server requests during active typing. Stock status classification (Optimal, Low, Out) is computed dynamically at query time by comparing each item's quantity against its threshold_level, and colour-coded status tags are rendered accordingly in the template. The module integrates with the operations app to reflect real-time stock levels updated by transactions.", { first: true }),
  h3("4.3.3 Operations and Stock Transactions Module (operations app)"),
  p("The operations module implements the most technically critical component of the system: atomic, race-condition-safe stock transaction processing. All stock movements — additions (Stock In), removals (Stock Out), and manual corrections (Adjustment) — are processed through the StockOperationService class, which implements the following sequence for every transaction:", { first: true }),
  num("Acquire a database-level write lock on the target Item record using select_for_update(), preventing any other concurrent transaction from reading or modifying the same record until the current transaction completes."),
  num("Validate the transaction against business rules — specifically, that a Stock Out transaction does not request more units than are currently available in stock."),
  num("Create the StockTransaction record capturing the operation type, quantity changed, quantity before, quantity after, initiating user, and timestamp."),
  num("Update the Item's quantity field using Django's F() expression (quantity = F('quantity') + delta), which generates an atomic SQL UPDATE statement that prevents the race condition that would occur if the quantity were read into Python, modified, and written back separately."),
  num("Commit the entire operation as a single database transaction using Django's transaction.atomic() context manager, ensuring that the transaction record and the quantity update either both succeed or both fail together."),
  p("This atomic locking implementation eliminates the data corruption risk that would otherwise occur when two staff members process transactions for the same item simultaneously — a realistic scenario in any retail environment with multiple point-of-sale stations.", { first: true }),
  h3("4.3.4 Automated Alerts Module (Celery background task)"),
  p("The automated alert module implements continuous stock level monitoring without placing any load on the main web server process. The check_low_stock_levels() Celery task is registered as a shared task decorated function that runs within a dedicated Celery worker process connected to the Redis message broker. Celery Beat, Django's periodic task scheduler, triggers this task at configurable intervals — by default every 15 minutes — without any manual initiation required.", { first: true }),
  p("When executed, the task performs a single optimised database query to retrieve all items whose quantity is less than or equal to their threshold_level. If any low-stock items are found, the task constructs a formatted email notification listing each item with its name, SKU, current quantity, and threshold level, and dispatches the email to all configured administrator email addresses using Django's mail backend. Simultaneously, the task creates Alert records in the database for each low-stock item, which are reflected in the dashboard alert badge count visible to all logged-in users on their next page load.", { first: true }),
  p("By executing this monitoring in a separate Celery worker process rather than in the web server, the main user-facing application remains fully responsive regardless of the monitoring task's execution time or the number of items being checked.", { first: true }),
  h3("4.3.5 REST API Module (Django Rest Framework)"),
  p("The REST API module exposes 30+ versioned endpoints at the /api/v1/ URL prefix, providing programmatic access to all core business logic for future mobile application integrations, third-party accounting software connections, or automated data pipeline consumers. All endpoints are secured with JWT authentication — requests without a valid Bearer token in the Authorization header receive a 401 Unauthorized response.", { first: true }),
  p("ItemViewSet implements the standard DRF ModelViewSet pattern with custom permission logic: GET requests (list and detail) are accessible to any authenticated user, while POST, PUT, PATCH, and DELETE requests are restricted to Manager and Admin roles through the IsManagerOrAdmin permission class. This permission model is consistently applied across all write-capable endpoints. Serialisers enforce schema validation equivalent to the form-level validation in the web interface, ensuring that API consumers cannot bypass business rules enforced for web users.", { first: true }),
  h3("4.3.6 Analytical Dashboard Module"),
  p("The analytical dashboard module delivers real-time operational intelligence through a combination of server-side ORM aggregations and client-side Chart.js visualisations. Four KPI metric cards are displayed at the top of the dashboard, each updated on every page load: Total Items (count of all active inventory items), Total Quantity (sum of all item quantities), Low Stock Alerts (count of items below threshold), and Transactions (total count of all stock movements).", { first: true }),
  p("The Stock Movement chart is a Chart.js bar chart displaying the aggregated quantities of Stock In, Stock Out, and Adjustment transactions over the selected time period (Today, 7 Days, or 30 Days), computed through a single SQL-level ORM aggregation query that groups StockTransaction records by transaction_type and sums quantity_changed values. The Category Distribution chart is a doughnut chart displaying the current stock quantity distribution across all inventory categories, computed through a Django ORM annotate() and values() aggregation that groups items by category and sums quantities.", { first: true }),
  p("These aggregations are implemented using Django's ExpressionWrapper, Sum, and Count ORM annotations rather than Python-level loops, ensuring that database-level set operations perform the computation efficiently regardless of dataset size, eliminating the N+1 query problem that would result from iterating through items in Python.", { first: true }),

  h2("4.4 Database Implementation and Dataset Characteristics"),
  h3("4.4.1 Database Implementation"),
  p("The backend uses PostgreSQL 15 as the production database, replacing Django's default SQLite in all containerised deployments. The schema leverages a fully normalised relational design with foreign key constraints enforcing referential integrity across all entity relationships. A critical implementation feature is the use of database-level CHECK constraints — not just application-level validation — to enforce business rules such as quantity ≥ 0 and unit_price ≥ 0, ensuring data validity even if records are modified directly at the database level during maintenance operations.", { first: true }),
  p("Unique indexes are maintained on username, email (accounts_customuser), sku (inventory_item), and title (inventory_category) to enforce uniqueness at the database level with efficient B-tree index lookups. Composite indexes on frequently joined column combinations — particularly item_id + timestamp in the StockTransaction table — reduce query planning overhead for dashboard aggregation queries.", { first: true }),
  h3("4.4.2 Dataset Characteristics — Nigerian Business Context"),
  p("To validate the system under realistic business conditions and demonstrate its direct relevance to Nigerian SME operators, a comprehensive Nigerian-context dataset was generated and loaded into the PostgreSQL database through Django's management command framework (python manage.py load_sample_data):", { first: true }),
  ...blank(1),
  tbl(["Entity", "Count", "Nigerian Context Details"], [
    ["Admin Users", "1", "Chidera Obilo (Admin) — system administrator with full access"],
    ["Manager Users", "2", "Emeka Okoro (Manager), Ada Nwosu (Manager) — inventory and operations management"],
    ["Staff Users", "3", "Three staff accounts with operational access limited to transaction recording"],
    ["Suppliers", "7", "TechZone Nigeria Ltd, FurniCraft Works Abuja, CleanPro Supplies Lagos, PrintMaster Nigeria, OfficeHub Calabar, SafetyFirst NG, KitchenCraft Nigeria"],
    ["Categories", "8", "Electronics, Office Supplies, Furniture, Networking Equipment, Cleaning Supplies, Safety Equipment, Printing Supplies, Kitchen & Pantry"],
    ["Inventory Items", "35", "Realistic Nigerian retail items with ₦ (Naira) valuations: HP ProBook 450 (₦450,000), A4 Office Paper Ream (₦5,000), Sugar 1kg Pack (₦1,200), USB-C Hub 7-in-1 (₦18,500)"],
    ["Stock Transactions", "40", "One year of simulated activity: Stock In (receiving deliveries), Stock Out (sales/consumption), and Adjustment (physical count corrections) — feeding 7-day and 30-day trend calculations"],
    ["Low-Stock Alerts", "4", "Generated items whose quantity was seeded at or below threshold_level to demonstrate the alert monitoring system"],
  ], [1200, 900, 7260]),
  p("Table 4.2: Dataset Characteristics — Nigerian Business Context", { center: true, italic: true }),
  ...blank(1),

  h2("4.5 Software Interfaces"),
  p("The system implements a Glassmorphism Premium UI design system across all four primary interface views, characterised by frosted-glass card effects with translucent backgrounds and subtle borders, a persistent responsive sidebar navigation with section groupings (Core, Inventory, Management), a top navigation bar featuring global search, theme toggle (dark/light mode via localStorage), and user profile menu, and dynamic CSS variables enabling consistent colour theming across all views. All interfaces support responsive layout across desktop and tablet viewports through Bootstrap 5's grid system.", { first: true }),
  h3("4.5.1 Authentication Screen (Login Interface)"),
  ...imgBox("4.1", "Authentication Screen — Secured Login Portal with Glassmorphism Card and Dark Mode"),
  p("The login interface (Figure 4.1) presents a centred Glassmorphism card with translucent frosted-glass styling against a dynamic gradient background that transitions between the system's brand colours. The card includes the system's box icon logo, a 'Welcome Back' heading with 'Smart Inventory Management System' subtitle, username and password fields with appropriate input icons, a 'Remember me' checkbox for session persistence preference, and a 'Sign In →' primary action button with loading state indication during authentication processing. Failed authentication attempts display inline error messages without page reload. The background gradient animation and dark mode support via localStorage-based CSS class toggling are implemented through a small vanilla JavaScript snippet included in the base template.", { first: true }),
  h3("4.5.2 Main Dashboard"),
  ...imgBox("4.2", "Main Dashboard — KPI Metric Cards, Stock Movement Bar Chart, and Category Distribution Doughnut Chart"),
  p("The main dashboard (Figure 4.2) provides the primary operational overview for inventory managers and administrators. The top row displays four floating metric cards with iconography and trend indicators: Total Items (35, shown as +2% from last week), Total Quantity (431 units, +4.5% overall stock), Low Stock Alerts (1 item flagged as 'Needs attention!'), and Transactions (40 operations to date). A time-range selector (Today / 7D / 30D) in the top-right adjusts the dataset for both charts simultaneously. The left chart is a Chart.js bar chart titled 'Stock Movement (Last 30 Days)' displaying Stock In, Stock Out, and Adjustments as grouped bars. The right chart is a doughnut chart titled 'Category Distribution' showing proportional stock representation across the 8 product categories with colour-coded legend. A welcome toast notification appears briefly on first login ('Welcome back, Chidera Okonkwo!'). The sidebar shows the user's avatar, name, and role designation.", { first: true }),
  h3("4.5.3 Inventory List View"),
  ...imgBox("4.3", "Inventory List View — Tabular Interface with Status Tags, Search, Category Filter, and Inline Actions"),
  p("The inventory list view (Figure 4.3) presents all inventory items in a modern tabular interface with the following functional components: a real-time JavaScript-debounced search field ('Name or SKU...') that filters results as the user types without full page reloads; a Category dropdown filter for narrowing the item list to a specific product category; a Stock Status filter for showing only Optimal, Low, or Out-of-stock items; an '+ Add New Item' primary action button in the top-right; and a structured data table with columns for Product Details (icon, name, and description), SKU, Category, Stock Status (colour-coded badge: green 'Optimal', orange 'Low', red 'Out'), Price (₦), and Actions (view detail and edit icons). The pagination component at the bottom of the table supports efficient navigation through large item catalogues. The sticky sidebar navigation remains visible during table scrolling.", { first: true }),
  h3("4.5.4 Stock Transaction History View"),
  ...imgBox("4.4", "Stock Transaction History View — Timestamped Audit Trail with Transaction Type Tags and User Attribution"),
  p("The transaction history view (Figure 4.4) presents a comprehensive chronological audit trail of all stock movements processed through the system. The interface provides a text search field for filtering by item name or transaction notes, and an 'All Types' dropdown for filtering to specific transaction types (Stock In, Stock Out, Adjustment). A 'New Transaction' button in the top-right initiates the transaction recording workflow. The data table displays columns for Date (full datetime stamp), Item (hyperlinked to item detail), Type (colour-coded badge: blue 'Stock In', red 'Stock Out', yellow 'Adjustment'), Quantity, Before (stock level before transaction), After (stock level after transaction), and User (username of the staff member who initiated the transaction). This view provides the complete accountability record required for inventory audits and discrepancy investigation.", { first: true }),

  h2("4.6 Discussion of Results"),
  h3("4.6.1 Testing Coverage and Results"),
  p("The system was subjected to rigorous automated testing using Pytest integrated with Factory Boy for isolated, reproducible test data generation. A total of 62 comprehensive test cases were executed across all functional modules, achieving a 100% pass rate with zero failures or errors. The test suite covers all critical functional areas:", { first: true }),
  ...blank(1),
  tbl(["Test Category", "Test Count", "Key Tests Covered", "Pass Rate"], [
    ["Authentication and RBAC", "12", "Login validation; session creation; role-based view access; privilege escalation prevention; POST-only logout enforcement; inactive account blocking", "100%"],
    ["Inventory CRUD", "14", "Item creation with all fields; SKU uniqueness enforcement; category assignment; item update; soft-delete; invalid input rejection (negative price, blank name)", "100%"],
    ["Atomic Stock Transactions", "10", "Stock-in processing; stock-out processing; concurrent transaction isolation via select_for_update(); insufficient stock rejection; transaction record creation", "100%"],
    ["Celery Alert Tasks", "8", "check_low_stock_levels() task execution; email dispatch routing through Redis; alert record creation; threshold boundary condition testing", "100%"],
    ["REST API Endpoints", "12", "JWT authentication; permission class enforcement on all write endpoints; serialiser validation; paginated response format; 403 Forbidden on unauthorised access", "100%"],
    ["Dashboard Aggregations", "6", "KPI card data accuracy; chart data aggregation correctness; time-range filter accuracy (Today/7D/30D); N+1 query elimination verification", "100%"],
    ["Total", "62", "", "100%"],
  ], [2000, 900, 4500, 1060]),
  p("Table 4.3: Pytest Test Coverage Summary", { center: true, italic: true }),
  ...blank(1),
  h3("4.6.2 Performance and Security Outcomes"),
  tbl(["Performance/Security Dimension", "Implementation", "Validated Outcome"], [
    ["Concurrent Transaction Safety", "select_for_update() row-level locking + transaction.atomic()", "Simulated parallel stock transactions produced 100% accurate results with zero data overwrite incidents across all test scenarios"],
    ["Dashboard Query Performance", "SQL-level ORM aggregation using ExpressionWrapper, Sum, Count annotate()", "Logarithmic-complexity database aggregations replace Python-level iteration; dashboard loads in under 1 second with 35-item, 40-transaction dataset"],
    ["Password Security", "PBKDF2 SHA256 hashing; work factor prevents brute-force", "Hashed passwords verified not reversible from database; login timing analysis shows appropriate computational delay"],
    ["Privilege Escalation Prevention", "Role field excluded from profile form and API serialiser", "Direct attempts to modify role via form submission, URL manipulation, and API PATCH request all blocked with appropriate error responses"],
    ["CSRF Protection", "Django CSRF middleware; POST-only state changes", "Cross-origin state-change requests correctly rejected; legitimate requests processed normally"],
    ["JWT API Security", "DRF Simple JWT; IsManagerOrAdmin permission class", "Unauthenticated API requests receive 401; authenticated non-Manager requests to write endpoints receive 403"],
    ["Alert Task Execution", "Celery + Redis; Celery Beat scheduling", "Background task executes without blocking web server; email dispatched successfully in test SMTP environment; alert records created correctly"],
  ], [2000, 2800, 4560]),
  p("Table 4.4: Performance and Security Outcomes", { center: true, italic: true }),
  ...blank(1),
  h3("4.6.3 Achievement of Functional Requirements"),
  p("All 12 functional requirements specified in Table 3.1 of Chapter Three were successfully implemented and validated through the Pytest test suite and manual functional testing:", { first: true }),
  bl("FR-01 (User Authentication): Django session-based authentication with CustomUser model implemented and tested across 12 authentication test cases with 100% pass rate."),
  bl("FR-02/FR-03 (Inventory CRUD): Full create, read, update, and delete operations implemented for Items, Categories, and Suppliers with complete field validation."),
  bl("FR-04 (Sales Processing): StockTransaction model with Stock Out type implements sales recording with automatic stock reduction via atomic F() expression updates."),
  bl("FR-07 (Automated Reorder Alerts): Celery background task implemented and validated through 8 alert-specific test cases including Redis routing and email dispatch verification."),
  bl("FR-09 (Analytical Dashboard): Chart.js bar chart and doughnut chart implemented with SQL-level aggregations; 6 dashboard aggregation test cases confirm data accuracy."),
  bl("FR-10 (Role-Based Access Control): Admin, Manager, and Staff roles implemented with privilege separation enforced at view level, API level, and database schema level."),
  bl("FR-11 (REST API): 30+ versioned endpoints at /api/v1/ with JWT authentication and permission classes implemented and validated through 12 API test cases."),
  h3("4.6.4 User Interface Validation"),
  p("The Glassmorphism UI design was validated against usability criteria derived from the Technology Acceptance Model framework that underpins the study's theoretical design rationale. The interface achieves the Perceived Ease of Use objective through: intuitive sidebar navigation with clear section groupings requiring no training to understand; colour-coded stock status badges (Optimal/Low/Out) enabling at-a-glance inventory health assessment without reading quantity numbers; inline action buttons reducing the number of page navigations required to complete common tasks; and real-time JavaScript search that provides instant visual feedback as the user types.", { first: true }),
  p("The dark mode toggle implemented via localStorage persistence demonstrates awareness of user preference diversity — a feature that emerged from TAM's emphasis on minimising the friction that reduces system adoption. The localStorage implementation ensures the user's theme preference is preserved across sessions without requiring a database round-trip on each page load.", { first: true }),
  h3("4.6.5 Challenges and Resolutions Encountered"),
  p("The most significant technical challenge encountered during implementation was the management of concurrent stock transactions from multiple simulated user sessions in the testing environment. Initial implementation without database-level locking produced occasional data inconsistencies when two test threads processed transactions for the same item within milliseconds of each other. The resolution — replacing Python-level read-modify-write operations with select_for_update() database locks combined with F() expression updates — completely eliminated these inconsistencies, as verified by the SYNC-001 concurrent transaction test case.", { first: true }),
  p("A secondary implementation challenge involved the sequential loading of Celery task definitions during Django application startup in development mode, which occasionally caused task discovery failures when the Celery worker started before Django's app registry was fully initialised. This was resolved by configuring the Celery application to use Django's apps.ready() signal for task registration, ensuring tasks are discovered only after the complete application registry is available.", { first: true }),

  h2("4.7 Summary"),
  p("Chapter Four documented the comprehensive practical realisation of the Smart Inventory Management System, from technology stack selection through module implementation, database deployment, interface design, and rigorous testing. The system was implemented using Python 3.11+ and Django 4.x with a PostgreSQL 15 relational database, Celery + Redis asynchronous task processing, Chart.js analytical visualisations, and a complete Docker containerised deployment architecture.", { first: true }),
  p("The 62 Pytest cases achieving a 100% pass rate confirm that all specified functional and non-functional requirements have been met: all CRUD operations function correctly; authentication and role-based access control enforce appropriate privilege separation; atomic stock transaction processing eliminates race conditions under concurrent usage; the Celery background alert task executes successfully without web server interference; and the REST API correctly enforces JWT authentication and permission boundaries.", { first: true }),
  p("The Nigerian-context dataset of 35 items, 7 suppliers, 8 categories, and 40 transactions with Naira valuations validated the system under realistic business conditions, confirming data integrity, analytical report accuracy, and interface usability across all role-differentiated user types. The Glassmorphism UI design successfully delivers an enterprise-grade visual experience that is simultaneously accessible to non-technical SME operators, supporting the Technology Acceptance Model objective of maximising Perceived Ease of Use among the target user population.", { first: true }),
  pb()
);

// ════════════════════════════════════════════════════
//  CHAPTER FIVE
// ════════════════════════════════════════════════════
children.push(h1("CHAPTER FIVE"), h1("CONCLUSION AND RECOMMENDATIONS"));
children.push(
  h2("5.1 Summary of Findings"),
  p("This study successfully designed, implemented, tested, and evaluated a web-based Smart Inventory Management System tailored for the operational context and technological realities of small and medium-scale enterprises in Nigeria. The system directly addresses the five core challenges identified in the problem statement: high manual data-entry error rates, absence of real-time stock visibility, slow and inadequate analytical reporting, limited concurrent multi-user access, and poor data-driven purchasing decision support.", { first: true }),
  p("The key findings emerging from the development, testing, and evaluation phases are as follows:", { first: true }),
  bl("The system provides accurate, real-time tracking of all inventory items through automated stock quantity updates executed atomically during transaction processing, effectively eliminating the data inconsistencies and reconciliation burdens that characterise spreadsheet-based manual systems."),
  bl("Automated reorder-point monitoring implemented through Celery background tasks operating asynchronously over Redis message queues delivers timely low-stock alerts via email and dashboard notifications without requiring manual stock count activities or continuous human monitoring."),
  bl("Analytical dashboards featuring Chart.js bar charts for stock movement trends and doughnut charts for category distribution, combined with real-time KPI metric cards, provide business owners and managers with immediate, interpretable operational intelligence that manual reporting methods cannot match for timeliness or visual clarity."),
  bl("Rigorous testing comprising 62 Pytest cases covering authentication logic, CRUD operations, concurrent transaction processing, API endpoint security, Celery task execution, and dashboard data aggregation confirmed a 100% pass rate, with robust concurrent transaction handling validated through the SYNC-001 atomic transaction test."),
  bl("The modular Django architecture (separate apps for accounts, inventory, operations, alerts, and api) combined with PostgreSQL 15, Celery, Redis, and Docker containerisation delivers a system with high usability, comprehensive security (RBAC, PBKDF2 hashing, CSRF protection, HSTS, JWT), and the scalability to accommodate growing SME operations."),
  bl("The three-tier architecture (presentation, application, and data layers) and the versioned REST API (30+ endpoints at /api/v1/) establish a strong foundation for future functional extensions including mobile application development, accounting software integration, and payment gateway connectivity."),
  p("Overall, the implemented system demonstrates a practical, affordable, and technically robust transition pathway from manual to smart inventory management that is directly achievable by Nigerian SMEs without requiring expensive proprietary software licenses, specialised hardware infrastructure, or dedicated IT staff.", { first: true }),

  h2("5.2 Achievement of Research Objectives"),
  p("This study fully achieved all four stated research objectives. The following table maps each objective to its implementation realisation and validation evidence:", { first: true }),
  ...blank(1),
  tbl(["Objective", "Implementation", "Validation Evidence", "Status"], [
    ["Gather and analyse system requirements using established elicitation techniques", "Synthetic data analysis (38 representative responses); structured literature review of 12 related studies; functional and non-functional requirements specification produced", "Requirements document produced; all FR and NFR traceable to system modules; alignment verified in Chapter 4", "Fully Achieved"],
    ["Design a scalable, modular web-based Smart Inventory Management System architecture", "Three-tier architecture (presentation/application/data); 6-module Django app structure; UML use case, class, and activity diagrams; normalised PostgreSQL schema; REST API design", "Architecture diagram (Fig. 3.1); UML diagrams (Figs. 3.2–3.4); database schema tables (Tables 3.4–3.9); ER diagram (Fig. 3.5)", "Fully Achieved"],
    ["Implement the system using Python and Django with PostgreSQL, Celery, and REST API", "Django 4.x + Python 3.11 + PostgreSQL 15; 6 functional modules; 30+ DRF API endpoints; Celery + Redis async tasks; Docker deployment; Glassmorphism UI", "Chapter 4 module descriptions; Table 4.1 technology stack; code snippets in Appendix B; 62 Pytest cases", "Fully Achieved"],
    ["Test and evaluate the system for reliability, security, and performance", "62 Pytest test cases (auth, CRUD, concurrency, Celery, API, dashboard); Nigerian-context 35-item dataset; performance benchmarks; security outcome evaluation", "Table 4.3 (100% pass rate); Table 4.4 performance and security outcomes; Chapter 4.6 discussion of results", "Fully Achieved"],
  ], [1800, 2800, 2800, 1160]),
  p("Table 5.1: Achievement of Research Objectives", { center: true, italic: true }),

  h2("5.3 Contributions to Knowledge and Practice"),
  h3("5.3.1 Contributions to Knowledge"),
  p("This study makes several distinct contributions to the academic literature on web-based inventory systems, SME digital transformation, and practical software engineering for developing economy contexts:", { first: true }),
  bl("It demonstrates how Django-based development, combined with asynchronous task processing (Celery), enterprise-grade relational database management (PostgreSQL), and modern UI design (Glassmorphism) can deliver SME-appropriate inventory management solutions that are simultaneously affordable, technically robust, and visually professional."),
  bl("It addresses specific gaps identified in related works (Erameh & Odoh, 2021; Chukwumuanya et al., 2024; Soegoto & Palalungan, 2020) by integrating the three capabilities most consistently absent in SME-focused implementations: user-friendly analytical reporting, proper role-based security controls, and software-only automated monitoring without IoT hardware dependencies."),
  bl("It provides a fully documented, reproducible implementation reference — including database schema, source code excerpts, test cases, and deployment configuration — that future researchers can adapt and extend for related investigations in inventory automation, SME digitalisation, and web application development in Nigerian and comparable developing-economy contexts."),
  bl("The Nigerian-context dataset with Naira valuations, locally named products, and Nigerian-specific supplier and user records provides a culturally appropriate empirical foundation that contributes to the sparse body of inventory system research specifically situated in Nigerian retail contexts."),
  h3("5.3.2 Contributions to Practice"),
  p("The practical contributions of this project are equally significant for Nigerian SME operators and the technology ecosystem that serves them:", { first: true }),
  bl("The system offers a cost-effective, deployable inventory management tool that eliminates the most financially damaging consequences of manual inventory management — stockouts from insufficient monitoring, overstocking from inadequate data, and financial discrepancies from manual calculation errors — without requiring any enterprise software licensing fees."),
  bl("For small Nigerian businesses, the Naira-valued dataset and locally contextualised interface demonstrate that the system is built with their specific operational environment in mind rather than being adapted from an international template. This cultural specificity is identified as a significant factor in SME technology adoption."),
  bl("The Docker-containerised deployment architecture ensures that the system can be reliably deployed on affordable Nigerian cloud hosting services without specialised DevOps expertise, using a single docker-compose up --build command to start the complete application stack."),
  bl("The researcher's personal motivation from family business experience grounds the system's practical value in authentic lived experience, reinforcing its potential to deliver real operational improvements to businesses in circumstances directly comparable to those that motivated its development."),

  h2("5.4 Conclusions"),
  p("The design and implementation of this web-based Smart Inventory Management System confirms that digital automation is both a viable and a practically necessary response to the documented inefficiencies of manual inventory management in SME contexts. By leveraging a mature, open-source web technology stack (Python, Django, PostgreSQL, Celery, Redis, Docker), the system achieves real-time stock visibility, error elimination through automated processing, proactive low-stock alert notifications, and comprehensive analytical reporting — all at a total software cost of zero, using exclusively open-source and freely available technologies.", { first: true }),
  p("The 100% Pytest pass rate, the successful handling of concurrent stock transactions through database-level atomic locking, the confirmed security of the role-based access control implementation, and the intuitive usability of the Glassmorphism interface collectively validate that the system meets or exceeds all specified functional and non-functional requirements. The system is not merely an academic exercise but a production-quality prototype with genuine potential to transform inventory management practices in small Nigerian retail and supply businesses.", { first: true }),
  p("The study also demonstrates the enduring relevance of established theoretical frameworks — Information Systems Theory, the Technology Acceptance Model, and Systems Theory — in guiding practical software design decisions. The TAM-informed interface design choices, the IST-grounded data integration architecture, and the Systems Theory-derived module integration approach collectively produced a system that is both technically sound and well-aligned with the operational realities and adoption constraints of its target users.", { first: true }),
  p("In conclusion, the Smart Inventory Management System represents a meaningful and practical contribution to the ongoing digital transformation of Nigerian SMEs, demonstrating that targeted, affordable, and culturally contextualised technology solutions can empower small businesses to operate with greater professionalism, reduced financial risk, and stronger competitive positioning in a digital economy where automation is increasingly a standard business practice.", { first: true }),

  h2("5.5 Recommendations"),
  p("Based on the study's findings and the practical insights gained during system development and evaluation, the following recommendations are directed at key stakeholders:", { first: true }),
  h3("5.5.1 Recommendations for SME Operators"),
  bl("Adoption of web-based inventory systems: Small and medium-scale business owners, particularly those in retail, distribution, and family-run enterprises, should actively consider adopting this system or comparable open-source inventory management platforms to replace manual methods. The initial investment in staff training and system setup is substantially outweighed by the ongoing benefits of reduced stock losses, improved purchasing decisions, and time savings from automated reporting."),
  bl("Staff training before deployment: Prior to live deployment, invest time in familiarising all staff members with the system's interface and their role-specific functionality. The Glassmorphism interface is designed for minimal training requirements, but even a brief orientation session will accelerate the realisation of benefits and build user confidence."),
  bl("Regular threshold configuration reviews: Ensure that each product's threshold_level is reviewed and updated at least once per quarter to reflect seasonal demand variations, supplier lead time changes, and evolving sales patterns. The automated alert system's effectiveness is directly proportional to the accuracy of the configured threshold values."),
  h3("5.5.2 Recommendations for Deployment and Operations"),
  bl("Cloud hosting on Docker-compatible platforms: Host the system on a reliable Nigerian cloud hosting provider (such as Whogohost, QServers, or AWS Nigeria region) using Docker Compose for consistent and reproducible deployment. Ensure daily automated database backups are configured and periodically tested for successful restoration."),
  bl("Regular security updates: Schedule monthly reviews of all framework and library dependency versions (Django, PostgreSQL, Celery, Redis) and apply security patches promptly. Subscribe to Django security mailing lists to receive timely notification of critical vulnerability disclosures."),
  bl("Integration with accounting tools: Where possible, connect the system's REST API to business accounting software (such as QuickBooks, Sage, or local Nigerian accounting platforms) to eliminate manual re-entry of sales data in financial records."),
  h3("5.5.3 Recommendations for Policy and Institutional Support"),
  bl("Government and institutional promotion: Agencies supporting SME development, including the Small and Medium Enterprise Development Agency of Nigeria (SMEDAN) and tertiary institutions such as Arthur Jarvis University, should actively promote awareness of open-source digital inventory tools and provide training subsidies or workshops to accelerate ICT adoption among small businesses."),
  bl("Curriculum integration: Computer Science departments in Nigerian universities should include practical web application development projects with real-world SME applications as part of final-year project requirements, building a pipeline of locally relevant open-source tools developed by Nigerian students and graduates."),

  h2("5.6 Suggestions for Future Work"),
  p("While the current system successfully fulfils all stated research objectives and delivers a production-quality implementation, the following extensions are recommended to evolve the platform into a more comprehensive and intelligent business management solution:", { first: true }),
  bl("Artificial Intelligence and Demand Forecasting: Integrate basic machine learning models for sales demand forecasting, enabling the system to predict future stock requirements based on historical sales patterns, seasonal trends, and product lifecycle data. Python's scikit-learn library provides accessible implementations of linear regression, ARIMA time series forecasting, and gradient boosting approaches that could be integrated within the existing Django backend without fundamental architectural changes."),
  bl("Mobile Application (Android and iOS): Develop a companion mobile application using React Native or Flutter that consumes the existing REST API, enabling business owners to check stock levels, approve transactions, and receive push notifications for low-stock alerts from their smartphones. The versioned, JWT-secured REST API endpoint structure was specifically designed with this future integration in mind."),
  bl("Barcode and QR Code Integration: Implement barcode and QR code scanning support through a mobile companion app camera integration or a connected USB barcode reader, enabling semi-automated stock additions and sales processing without manual SKU entry. This represents the most accessible form of physical automation enhancement achievable without the high cost of full RFID infrastructure."),
  bl("Payment Gateway Integration: Add a payment processing module supporting Nigerian payment platforms — Paystack, Flutterwave, or Interswitch — to enable the system to serve as a basic point-of-sale application that records both the inventory transaction and the corresponding financial settlement in a single workflow."),
  bl("Multi-Branch and Multi-Location Support: Extend the data model to support organisations with multiple physical locations, enabling stock transfers between branches, consolidated reporting across the full business operation, and location-specific inventory management with appropriate access controls."),
  bl("IoT and RFID Integration: In future iterations with adequate hardware budget, enable optional integration with low-cost IoT sensors or RFID readers for partially automated stock counting, reducing the manual data entry requirement that represents the system's primary remaining operational limitation."),
  bl("User Experience Research with Live SME Users: Conduct quantitative user experience research with actual Nigerian SME operators using the system in live business environments over an extended period (three to six months minimum). Measure concrete operational outcomes including reduction in stockout frequency, time saved per week on inventory management tasks, reduction in stock discrepancy incidents, and change in business profitability — providing empirical evidence of the system's real-world impact beyond laboratory testing."),

  h2("5.7 Closing Remark"),
  p("The successful completion of this Smart Inventory Management System marks a meaningful milestone in the researcher's application of computer science principles to address authentic, practical business challenges experienced directly within a family business context. The project fulfils its academic requirements as a rigorous final-year research and implementation study while simultaneously delivering a tool with genuine potential to improve how small businesses manage their most operationally critical asset: their inventory.", { first: true }),
  p("The convergence of accessible open-source web technologies, affordable cloud hosting infrastructure, and the growing digital literacy of Nigerian small business operators creates a uniquely favourable environment for the widespread adoption of solutions like this one. As digital transformation continues to reshape business operations across developing economies, smart inventory management systems represent one of the most immediate, high-impact, and financially accessible entry points for SMEs into the digital economy.", { first: true }),
  p("The researcher remains open to collaborative partnerships for further system development, live deployment evaluation, extension research, or knowledge transfer to businesses and institutions seeking to adopt or adapt this solution. It is hoped that this work will inspire other Nigerian computer science students and researchers to build practical, culturally grounded technology solutions that directly serve the operational needs of their communities.", { first: true }),
  pb()
);

// ════════════════════════════════════════════════════
//  REFERENCES
// ════════════════════════════════════════════════════
children.push(h1("REFERENCES"));
const refs = [
  "Afolayan, F. A., Okagbue, I. H., Odukoya, J. O., & Oguntunde, P. E. (2019). Inventory management techniques: A comparative analysis. Journal of Physics: Conference Series, 1378(2), Article 022058. https://doi.org/10.1088/1742-6596/1378/2/022058",
  "Agrawal, N., & Smith, S. A. (2020). Retail supply chain management: Quantitative models and empirical studies (2nd ed.). Springer.",
  "Akindipe, O. (2014). Inventory management — A tool for optimal use of resources and overall efficiency in manufacturing SMEs. Journal of Entrepreneurship, Management and Innovation, 10(4), 89–104. https://doi.org/10.7341/20141044",
  "Alami, A., & Krancher, O. (2022). How Scrum adds value to achieving software quality? Empirical Software Engineering, 27(7), Article 165. https://doi.org/10.1007/s10664-022-10208-4",
  "Azanha, A., Tiradentes Terra Argoud, A. R., Camargo Junior, J. B., & Antoniolli, P. D. (2017). Agile project management with Scrum: A case study of a Brazilian pharmaceutical company IT project. International Journal of Managing Projects in Business, 10(1), 121–142. https://doi.org/10.1108/IJMPB-09-2015-0085",
  "Chukwumuanya, O. E., Onwurah, U. O., & Ihueze, C. C. (2024). Development of a web-based inventory management system for small businesses. International Journal of Industrial and Production Engineering, 5(1), 45–58. https://journals.unizik.edu.ng/ijipe/article/view/4096",
  "Davis, F. D. (1989). Perceived usefulness, perceived ease of use, and user acceptance of information technology. MIS Quarterly, 13(3), 319–340. https://doi.org/10.2307/249008",
  "Eneje, B. C., Nweze, O., & Udeh, S. N. (2017). Inventory management and SMEs profitability: A study of furniture manufacturing, wholesale, and eatery industry in Delta State, Nigeria. Journal of Finance and Accounting, 5(3), 85–92. https://doi.org/10.11648/j.jfa.20170503.11",
  "Erameh, K. B., & Odoh, B. I. (2021). Design and implementation of a web-based inventory control system using a small medium enterprise (SME) as a case study. NIPES Journal of Science and Technology Research, 3(3), 211–219. https://doi.org/10.37933/nipes/3.3.2021.21",
  "Harris, F. W. (1913). How many parts to make at once. Factory, The Magazine of Management, 10(2), 135–136, 152. (Reprinted in Operations Research, 38(6), 947–950, 1990)",
  "Illiemena, R. O., Aniefor, S. J., & Odukoya, J. O. (2022). Inventory management and organizational performance: A study of selected firms in Delta State, Nigeria. Journal of Business and Management Sciences, 10(2), 44–52.",
  "Ismail, N., & Abdullah, R. (2019). Automation in inventory management systems: Challenges and opportunities. Journal of Advanced Research in Business and Management Studies, 14(1), 18–29.",
  "Kareem, M. A. (2018). Impact of inventory management practices on small and medium enterprises manufacturing subsector in Oyo State, Nigeria. Journal of Business and Management, 20(5), 45–56.",
  "Kim, M., & Peterson, R. (2017). Data-driven optimization in inventory decision-making. International Journal of Logistics Management, 28(4), 1180–1205.",
  "Kumar, S., & Ramasamy, M. (2020). Smart inventory management using automated systems: A review. International Journal of Advanced Research in Computer Science, 11(3), 67–74.",
  "Laudon, K. C., & Laudon, J. P. (2020). Management information systems: Managing the digital firm (17th ed.). Pearson.",
  "Munyaka, J. B., & Yadavalli, V. S. S. (2022). Inventory management concepts and implementations: A systematic literature review. South African Journal of Industrial Engineering, 33(3), 15–35. https://doi.org/10.7166/33-3-2670",
  "Nemtajelai, S., & Mbohwa, C. (2016). Challenges of inventory management in small and medium enterprises in developing countries. Procedia CIRP, 40, 28–33. https://doi.org/10.1016/j.procir.2016.01.045",
  "Netsuite. (2022). Inventory management: Definition, types and best practices. Oracle NetSuite Blog. https://www.netsuite.com/portal/resource/articles/inventory-management/inventory-management.shtml",
  "Oberholzer, M. (2021). Business analytics and inventory decision-making in small enterprises. Journal of Applied Business Research, 37(4), 101–114.",
  "OECD. (2021). SME and entrepreneurship outlook 2021. OECD Publishing. https://doi.org/10.1787/97a55fae-en",
  "Olowolaju, O. P., & Mogaji, O. A. (2024). Inventory management practices and SMEs' performance in Lagos State. International Journal of Research and Innovation in Social Science, 8(6), 112–125. https://rsisinternational.org/journals/ijriss/articles/inventory-management-practices-and-smes-performance-in-lagos-state",
  "Rahimi, B., Nadri, H., & Lotfollahzadeh, H. (2020). Factors affecting the acceptance of hospital information systems based on the TAM model among health information management staff. Acta Informatica Medica, 28(4), 252–257.",
  "Rezaei, J. (2014). A note on EOQ model for growing items. International Journal of Production Economics, 155, 356–361. https://doi.org/10.1016/j.ijpe.2014.05.014",
  "Sebatjane, M., & Adetunji, O. (2019). Economic order quantity model for growing items with incremental quantity discounts. Journal of Industrial Engineering International, 15(1), 109–117. https://doi.org/10.1007/s40092-019-0311-0",
  "Smite, D., Moe, N. B., Klotins, E., & Gonzalez-Huerta, J. (2023). From forced working-from-home to voluntary working-from-home: Two revolutions in telework. Journal of Systems and Software, 195, Article 111509. https://doi.org/10.1016/j.jss.2022.111509",
  "Soegoto, E. S., & Palalungan, A. F. (2020). Web-based online inventory information system. IOP Conference Series: Materials Science and Engineering, 879(1), Article 012125. https://doi.org/10.1088/1757-899X/879/1/012125",
  "Stevenson, W. J. (2021). Operations management (14th ed.). McGraw-Hill Education.",
  "von Bertalanffy, L. (1968). General system theory: Foundations, development, applications. George Braziller.",
  "Waller, M. A., & Fawcett, S. E. (2013). Data science, predictive analytics, and big data: A revolution that will transform supply chain design and management. Journal of Business Logistics, 34(2), 77–84. https://doi.org/10.1111/jbl.12010",
  "Wasp Barcode. (2013). Wasp barcode technologies annual inventory and business operations report. Wasp Barcode Technologies.",
  "Wibisono, R. S., Sofianti, T. D., & Awibowo, S. (2016). Development of a web-based information system for material inventory control: The case of an automotive company. CommIT Journal, 10(2), 73–81. https://doi.org/10.21512/commit.v10i2.1579",
  "Wild, T. (2017). Best practice in inventory management (3rd ed.). Routledge.",
  "World Bank. (2021). Small and medium enterprises (SMEs) finance. The World Bank Group. https://www.worldbank.org/en/topic/smefinance",
  "Yego, J., & Nderui, D. (2024). Application of the EOQ model in SMEs: Challenges and opportunities in East African retail. African Journal of Business and Economic Research, 19(1), 88–104.",
  "Yurindra, & Wijaya, A. (2018). Web-based inventory system with EOQ algorithm integration. Journal of Physics: Conference Series, 1007(1), Article 012055. https://doi.org/10.1088/1742-6596/1007/1/012055",
  "Zeballos, L. J., Mendez, C. A., & Seifert, R. W. (2018). Multi-period optimization of retail inventory management with demand learning and supply chain disruptions. International Journal of Production Economics, 196, 134–146. https://doi.org/10.1016/j.ijpe.2017.11.002",
];
refs.forEach(ref => children.push(new Paragraph({
  spacing: { before: 120, after: 60, line: 360, lineRule: "auto" },
  indent: { left: 720, hanging: 720 },
  children: [new TextRun({ text: ref, font: F, size: BS, color: "000000" })]
})));
children.push(pb());

// ════════════════════════════════════════════════════
//  APPENDICES
// ════════════════════════════════════════════════════
children.push(
  h1("APPENDIX A: DATABASE SCHEMA AND ENTITY-RELATIONSHIP DIAGRAM"),
  h2("A.1 Core Database Tables — Normalised Relational Schema"),
  p("The following tables constitute the complete normalised relational schema for the Smart Inventory Management System as deployed on PostgreSQL 15. All tables include an auto-incrementing integer primary key and timestamp fields. Foreign key relationships enforce referential integrity at the database level.", { first: true }),
  ...blank(1),
  tbl(["Table Name", "Primary Key", "Foreign Keys", "Key Constraints"], [
    ["accounts_customuser", "id (INT, AI)", "None", "UNIQUE(username, email); CHECK role IN ('ADMIN','MANAGER','STAFF')"],
    ["inventory_category", "id (INT, AI)", "None", "UNIQUE(title)"],
    ["inventory_supplier", "id (INT, AI)", "None", "UNIQUE(contact_email)"],
    ["inventory_item", "id (INT, AI)", "category_id → inventory_category; supplier_id → inventory_supplier", "UNIQUE(sku); CHECK quantity ≥ 0; CHECK unit_price ≥ 0; CHECK threshold_level ≥ 0"],
    ["operations_stocktransaction", "id (INT, AI)", "item_id → inventory_item; user_id → accounts_customuser", "CHECK transaction_type IN ('IN','OUT','ADJUSTMENT'); CHECK quantity_changed > 0"],
    ["alerts", "id (INT, AI)", "product_id → inventory_item; resolved_by_id → accounts_customuser (nullable)", "CHECK status IN ('UNREAD','RESOLVED')"],
  ], [2200, 1500, 2800, 3060]),
  ...blank(1),
  p("A.2 Entity-Relationship Diagram Description: The system uses a relational model with the following primary relationships: One-to-Many — Category → Items (each category can contain multiple items); One-to-Many — Supplier → Items (each supplier can supply multiple items); One-to-Many — CustomUser → StockTransactions (each user can initiate multiple transactions); One-to-Many — Item → StockTransactions (each item can have multiple transaction records). Referential integrity is enforced through PostgreSQL foreign key constraints with CASCADE UPDATE and RESTRICT DELETE to prevent orphaned records.", { first: true }),
  pb(),

  h1("APPENDIX B: KEY SOURCE CODE SNIPPETS"),
  h2("B.1: Atomic Stock Transaction Processing (operations/services.py)"),
  new Paragraph({
    spacing: { before: 60, after: 60 }, children: [new TextRun({
      text: `from django.db import transaction
from django.db.models import F
from django.core.exceptions import ValidationError
from .models import StockTransaction
from inventory.models import Item

class StockOperationService:
    @staticmethod
    @transaction.atomic
    def stock_out(item, quantity, user, notes=''):
        # Lock the row to prevent concurrent modifications
        locked_item = Item.objects.select_for_update().get(pk=item.pk)
        
        if locked_item.quantity < quantity:
            raise ValidationError(
                f"Insufficient stock. Available: {locked_item.quantity}, Requested: {quantity}"
            )
        
        previous_quantity = locked_item.quantity
        
        # Use F() expression for atomic update at database level
        Item.objects.filter(pk=item.pk).update(quantity=F('quantity') - quantity)
        locked_item.refresh_from_db()
        
        transaction_obj = StockTransaction.objects.create(
            item=locked_item, transaction_type='OUT',
            quantity_changed=quantity,
            previous_quantity=previous_quantity,
            new_quantity=locked_item.quantity,
            user=user, notes=notes
        )
        return transaction_obj`, font: "Courier New", size: 18, color: "000000"
    })]
  }),
  ...blank(1),
  h2("B.2: Asynchronous Low-Stock Alert Task (operations/tasks.py)"),
  new Paragraph({
    spacing: { before: 60, after: 60 }, children: [new TextRun({
      text: `from celery import shared_task
from django.db.models import F
from inventory.models import Item

@shared_task(bind=True, max_retries=3)
def check_low_stock_alerts(self):
    """
    Check all items for low stock and trigger notifications.
    Runs periodically via Celery Beat.
    """
    from inventory.models import Item
    
    low_stock_items = Item.objects.filter(
        quantity__lte=F('threshold_level')
    ).select_related('category', 'supplier')
    
    if low_stock_items.exists():
        count = low_stock_items.count()
        # Logging and notification logic...
        return f"{count} low stock items detected"
    
    return "No low stock items"`, font: "Courier New", size: 18, color: "000000"
    })]
  }),
  ...blank(1),
  h2("B.3: Secure REST API ViewSet with Filtering (inventory/api_views.py)"),
  new Paragraph({
    spacing: { before: 60, after: 60 }, children: [new TextRun({
      text: `class ItemViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'supplier']
    search_fields = ['name', 'sku', 'description']
    
    def get_queryset(self):
        queryset = Item.objects.select_related('category', 'supplier').all()
        
        # Custom filter: stock_status
        stock_status = self.request.query_params.get('stock_status')
        if stock_status == 'in_stock':
            queryset = queryset.filter(quantity__gt=F('threshold_level'))
        elif stock_status == 'low_stock':
            queryset = queryset.filter(quantity__lte=F('threshold_level'), quantity__gt=0)
        elif stock_status == 'out_of_stock':
            queryset = queryset.filter(quantity=0)
            
        return queryset`, font: "Courier New", size: 18, color: "000000"
    })]
  }),
  pb(),

  h1("APPENDIX C: SAMPLE TEST CASES"),
  tbl(["Test ID", "Module", "Test Description", "Expected Outcome", "Status"], [
    ["OP-001", "operations", "Stock In operation updates quantity correctly and creates transaction", "Item quantity increases by 50; transaction type is 'IN'; quantity_changed is 50", "PASS"],
    ["OP-002", "operations", "Stock Out with insufficient quantity raises ValidationError", "ValidationError raised; stock quantity remains unchanged", "PASS"],
    ["API-001", "api", "Unauthenticated request to /api/v1/items/ returns 403", "Response status code is 403 Forbidden; access denied", "PASS"],
    ["API-002", "api", "Authenticated Admin creates new item via API", "Response status code is 201 Created; item data returned", "PASS"],
    ["API-003", "api", "Stock Out operation via API with insufficient stock", "Response status code is 400 Bad Request; error message returned", "PASS"],
    ["AUTH-001", "api", "Staff user (non-admin) attempts to list users", "Response status code is 403 Forbidden; permission denied", "PASS"],
    ["TASK-001", "operations", "check_low_stock_alerts task detects low stock items", "Task identifies items below threshold; returns count and log message", "PASS"],
    ["MODEL-001", "inventory", "Item model is_low_stock() returns True when below threshold", "Method accurately reflects stock status based on threshold level", "PASS"],
  ], [800, 1000, 3200, 2600, 760]),
  pb(),

  h1("APPENDIX D: USER MANUAL AND QUICK START GUIDE"),
  h2("D.1 System Installation and Startup"),
  p("Prerequisites: Docker and Docker Compose must be installed on the host machine. No other software installation is required.", { first: true }),
  num("Clone the project repository: git clone https://github.com/[repository]/smart-inventory.git"),
  num("Navigate to the project directory: cd smart-inventory"),
  num("Start all containers (web server, PostgreSQL, Redis, Celery): docker-compose up --build -d"),
  num("Load the Nigerian-context sample dataset: docker-compose exec web python manage.py load_sample_data"),
  num("Open the application in a web browser: http://localhost:8000"),
  h2("D.2 Default Login Credentials"),
  tbl(["Role", "Username", "Password", "Access Level"], [
    ["Admin", "admin", "admin123", "Full system access including user management and system settings"],
    ["Manager", "manager_emeka", "manager123", "Inventory, operations, reports, and alert management"],
    ["Staff", "staff_ada", "staff123", "Inventory viewing and basic transaction recording only"],
  ], [1200, 1500, 1500, 5160]),
  h2("D.3 Core Operations Quick Reference"),
  num("Add new inventory item: Sidebar → Items → '+ Add New Item' button → Complete all fields → Save"),
  num("Record stock transaction: Sidebar → Operations → '+ New Transaction' → Select item, type, and quantity → Confirm"),
  num("View analytical dashboard: Sidebar → Dashboard → Select time range (Today / 7D / 30D)"),
  num("View low-stock alerts: Dashboard KPI card 'Low Stock Alerts' → Click count to view item list"),
  num("Manage users: Sidebar → [Admin only] System Settings → User Management"),
  pb(),

  h1("APPENDIX E: SAMPLE DATASET — NIGERIAN BUSINESS CONTEXT"),
  tbl(["Item Name", "SKU", "Category", "Unit Price (₦)", "Qty", "Threshold"], [
    ["HP ProBook 450 G10 Laptop", "TECH-HP-450", "Electronics", "450,000", "8", "5"],
    ["Logitech MK270 Wireless Keyboard & Mouse", "TECH-LGT-MK270", "Electronics", "18,500", "35", "10"],
    ["A4 Office Paper (500-Sheet Ream)", "OFF-A4-001", "Office Supplies", "5,000", "42", "20"],
    ["HP 26A Toner Cartridge (Black)", "PRT-HP-26A", "Printing Supplies", "12,000", "11", "5"],
    ["Sugar (1kg Pack)", "KTCH-SGR-001", "Kitchen & Pantry", "1,200", "6", "10"],
    ["Instant Coffee (500g Tin)", "KTCH-COF-001", "Kitchen & Pantry", "5,800", "4", "8"],
    ["Disposable Paper Cups (Pack of 200)", "KTCH-CUP-001", "Kitchen & Pantry", "3,500", "25", "15"],
    ["Disposable Gloves (Box of 100)", "CLEN-GLV-001", "Cleaning Supplies", "4,200", "3", "10"],
    ["USB-C Hub 7-in-1", "TECH-USB-001", "Electronics", "18,500", "22", "8"],
    ["Fire Extinguisher (6kg CO2)", "SAF-EXT-001", "Safety Equipment", "45,000", "5", "3"],
    ["Samsung 27\" Curved Monitor", "TECH-SAM-27", "Electronics", "285,000", "18", "3"],
    ["RJ45 Connector (Pack of 100)", "NET-RJ45-001", "Networking Equipment", "2,800", "45", "15"],
  ], [2500, 1800, 1800, 1600, 800, 900]),
  p("Table A.1: Sample Nigerian Inventory Dataset — Selected Items with ₦ (Naira) Valuations", { center: true, italic: true }),
  ...blank(1),
  tbl(["Full Name", "Username", "Role", "Department"], [
    ["Chidera Obilo", "admin", "Admin", "System Administration"],
    ["Emeka Okoro", "manager_emeka", "Manager", "Operations Management"],
    ["Ada Nwosu", "manager_ada", "Manager", "Inventory Control"],
    ["Chidi Obi", "staff_chidi", "Staff", "Sales Processing"],
    ["Ngozi Eze", "staff_ngozi", "Staff", "Receiving"],
    ["Segun Adeyemi", "staff_segun", "Staff", "Stock Room"],
  ], [2500, 2000, 1500, 3360]),
  p("Table A.2: Sample User Dataset with Nigerian Names and Role Assignments", { center: true, italic: true }),
  pb(),

  h1("APPENDIX F: LIST OF TABLES"),
  tbl(["Table No.", "Title", "Chapter", "Page"], [
    ["2.1", "Summary of Manual vs. Smart Inventory Management Challenges", "1", "5"],
    ["2.2", "Comparison of Web-Based Inventory Systems in Related Works", "2", "24"],
    ["2.3", "Research Gaps and Proposed Solutions", "2", "32"],
    ["3.1", "Functional Requirements of the Smart Inventory Management System", "3", "37"],
    ["3.2", "Non-Functional Requirements", "3", "38"],
    ["3.3", "System Module Descriptions and Programming Structure", "3", "40"],
    ["3.4", "Database Table — accounts_customuser", "3", "43"],
    ["3.5", "Database Table — inventory_category", "3", "44"],
    ["3.6", "Database Table — inventory_supplier", "3", "44"],
    ["3.7", "Database Table — inventory_item", "3", "45"],
    ["3.8", "Database Table — operations_stocktransaction", "3", "46"],
    ["3.9", "Database Table — alerts", "3", "46"],
    ["3.10", "System Controls Implemented", "3", "47"],
    ["4.1", "Development Tools and Technology Stack", "4", "51"],
    ["4.2", "Dataset Characteristics — Nigerian Business Context", "4", "57"],
    ["4.3", "Pytest Test Coverage Summary", "4", "64"],
    ["4.4", "Performance and Security Outcomes", "4", "65"],
    ["5.1", "Achievement of Research Objectives", "5", "70"],
    ["A.1", "Sample Nigerian Inventory Dataset — Selected Items", "Appendix A", "92"],
    ["A.2", "Sample User Dataset with Nigerian Names and Role Assignments", "Appendix A", "92"],
  ], [900, 4200, 1200, 900]),
  pb(),

  h1("APPENDIX G: LIST OF FIGURES"),
  tbl(["Figure No.", "Title", "Chapter", "Page"], [
    ["1.1", "Conceptual Framework of the Smart Inventory Management System", "1", "3"],
    ["2.1", "Technology Acceptance Model (TAM) Adapted for This Study", "2", "22"],
    ["2.2", "Systems Theory Applied to Inventory Management — Integration of Business Functions", "2", "23"],
    ["3.1", "Three-Tier System Architecture — Presentation, Application, and Data Layers", "3", "41"],
    ["3.2", "Use Case Diagram — Smart Inventory Management System", "3", "42"],
    ["3.3", "UML Class Diagram — Core Entities, Attributes, Methods, and Relationships", "3", "43"],
    ["3.4", "Activity Diagram — Automated Stock Alert Notification Workflow", "3", "44"],
    ["3.5", "Entity-Relationship Diagram — Full Database Schema with Relationships", "3", "48"],
    ["4.1", "Authentication Screen — Login Portal with Glassmorphism Card and Dark Mode", "4", "59"],
    ["4.2", "Main Dashboard — KPI Metric Cards, Stock Movement Chart, Category Distribution", "4", "60"],
    ["4.3", "Inventory List View — Item Table with Status Tags, Search, and Inline Actions", "4", "61"],
    ["4.4", "Stock Transaction History View — Timestamped Audit Trail", "4", "62"],
  ], [900, 4600, 1200, 900]),
);

// ════════════════════════════════════════════════════
//  ASSEMBLE DOCUMENT
// ════════════════════════════════════════════════════
const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets", levels: [{
          level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 }, spacing: { before: 60, after: 60 } } }
        }]
      },
      {
        reference: "numbers", levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 }, spacing: { before: 60, after: 60 } } }
        }]
      },
    ]
  },
  styles: {
    default: { document: { run: { font: F, size: BS, color: "000000" } } },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: F, color: "000000" },
        paragraph: { spacing: { before: 480, after: 240 }, outlineLevel: 0, alignment: AlignmentType.CENTER }
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: F, color: "000000" },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 1 }
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, italics: true, font: F, color: "000000" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 }
      },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 },
        pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000", space: 4 } },
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "Smart Inventory Management System  |  Arthur Jarvis University  |  2026", font: F, size: 18, italics: true, color: "000000" })]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: "000000", space: 4 } },
          tabStops: [{ type: TabStopType.RIGHT, position: CW }],
          children: [
            new TextRun({ text: "Department of Mathematics and Computer Science  |  Arthur Jarvis University", font: F, size: 18, italics: true, color: "000000" }),
            new TextRun({ text: "\t", font: F, size: 18 }),
            new TextRun({ children: [PageNumber.CURRENT], font: F, size: 18, color: "000000" }),
          ]
        })]
      })
    },
    children
  }]
});

async function generateReport() {
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync("report.docx", buffer);
  console.log("✅ report.docx generated successfully!");
}

generateReport().catch(console.error);
