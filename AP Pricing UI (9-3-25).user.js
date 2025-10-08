// ==UserScript==
// @name         AP Pricing UI (9/3/25)
// @namespace    http://tampermonkey.net/
// @version      2.4
// @description  Volume pricing UI with search filter, selected button highlight, fixed copy alignment, quantity input, and copy email button (Excel-ready)
// @match        https://admin.otsystems.net*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const courseData = [
{ name: 'OSHA 40 Hour HAZWOPER - Online', item: '0077-1246', price: 210.0, sale: true, category: 'OSHA HAZWOPER Online' },
{ name: 'OSHA 32 Hour HAZWOPER - Online', item: '0089-1248', price: 200.0, sale: true, category: 'OSHA HAZWOPER Online' },
{ name: 'OSHA 24 Hour HAZWOPER Online', item: '0002-1247', price: 150.0, sale: true, category: 'OSHA HAZWOPER Online' },
{ name: 'OSHA 16 Hour HAZWOPER Upgrade (to the 40 Hour) - Online', item: '0071-1249', price: 122.5, sale: true, category: 'OSHA HAZWOPER Online' },
{ name: 'OSHA 8 Hour HAZWOPER Supervisor (Initial)', item: '0099-1269', price: 53.57, sale: true, category: 'OSHA HAZWOPER Online' },
{ name: 'OSHA 8 Hour HAZWOPER Refresher - Online (Without Wallet ID)', item: '0004-XXXX', price: 39.95, sale: false, category: 'OSHA HAZWOPER Online' },
{ name: 'OSHA 8 Hour HAZWOPER Refresher - Online (with Wallet ID Card)', item: '0003-XXXX', price: 44.95, sale: false, category: 'OSHA HAZWOPER Online' },
{ name: 'OSHA 8 Hour HAZWOPER Supervisor Refresher - Online (Without Wallet ID)', item: '0005-XXXX', price: 39.95, sale: false, category: 'OSHA HAZWOPER Online' },
{ name: 'OSHA 8 Hour HAZWOPER Supervisor Refresher with Wallet ID Card', item: '0006-XXXX', price: 44.95, sale: false, category: 'OSHA HAZWOPER Online' },
{ name: 'OSHA Hazard Communication Training Aligned with GHS', item: '0210-1150', price: 19.96, sale: true, category: 'OSHA HAZCOM & GHS Online' },
{ name: 'OSHA Hazard Communication Training Aligned with GHS With Wallet ID Card', item: '0211-1151', price: 23.96, sale: true, category: 'OSHA HAZCOM & GHS Online' },
{ name: 'Laboratory Bloodborne Pathogens (Needle Sharps Program)', item: '0015-1393', price: 29.95, sale: false, category: 'Laboratory Safety Online' },
{ name: 'OSHA Respiratory Protection Training', item: '0007-1221', price: 24.95, sale: false, category: 'OSHA Respiratory Protection Online' },
{ name: 'DOT Reasonable Suspicion for Supervisors', item: '0433-1480', price: 29.95, sale: true, category: 'Human Resource Online' },
{ name: 'Online Alcohol and Drugs in the Workplace Training', item: '0122-1313', price: 19.95, sale: false, category: 'Human Resource Online' },
{ name: 'Online Job Stress Prevention Training', item: '0120-1314', price: 19.95, sale: false, category: 'Human Resource Online' },
{ name: 'Online Sexual Discrimination & Harassment Prevention Training ', item: '0072-1726', price: 24.95, sale: false, category: 'Human Resource Online' },
{ name: 'Online Introduction to Supervision &amp; Leadership Training', item: '0119-1315', price: 19.95, sale: false, category: 'Human Resource Online' },
{ name: 'Online Work Schedules & Working Alone Training', item: '0121-1316', price: 19.95, sale: false, category: 'Human Resource Online' },
{ name: 'Online Human Resources Manager Training (Package of 4 classes)', item: '0118-1317', price: 49.95, sale: false, category: 'Human Resource Online' },
{ name: '24 Hour Hazardous Materials Technician Level III Responder - Online', item: '0246-2162', price: 175.0, sale: true, category: 'OSHA Hazmat Emergency Responder Online' },
{ name: '24 Hour Hazardous Materials Technician Level III Responder - 16 Hours Online (With Verifiable Part 1 (FRO) Prerequisite)', item: '0244-1756', price: 175.0, sale: false, category: 'OSHA Hazmat Emergency Responder Online' },
{ name: '16 Hour Hazardous Materials Technician Level III Responder - Online (16 Hours of Online Training to be combined w/8 Hours of Classroom Training done by the Employer)', item: '0280-2161', price: 175.0, sale: false, category: 'OSHA Hazmat Emergency Responder Online' },
{ name: 'Hazardous Materials Incident Commander Level V Responder Refresher Online (4 Hour)', item: '0296-1171', price: 59.95, sale: false, category: 'OSHA Hazmat Emergency Responder Online' },
{ name: 'Hazardous Materials Technician Level III Responder Refresher Online (8 Hour)', item: '0248-XXXX', price: 79.95, sale: false, category: 'OSHA Hazmat Emergency Responder Online' },
{ name: 'Hazardous Materials Technician Level III Responder Refresher Online (4 Hour)', item: '0249-XXXX', price: 59.95, sale: false, category: 'OSHA Hazmat Emergency Responder Online' },
{ name: 'Hazardous Materials First Responder Operations (FRO) Level II Responder (Includes Mailed ERG)', item: '0093-2168', price: 84.95, sale: false, category: 'OSHA Hazmat Emergency Responder Online' },
{ name: 'Hazardous Materials First Responder Operations (FRO) Level II Responder (Includes Downloadable ERG)', item: '0884-2195', price: 69.95, sale: false, category: 'OSHA Hazmat Emergency Responder Online' },
{ name: 'Hazardous Materials First Responder Operations (FRO) Level II Responder Refresher (8 Hour) (Includes Mailed ERG)', item: '0097-2171', price: 84.95, sale: false, category: 'OSHA Hazmat Emergency Responder Online' },
{ name: 'Hazardous Materials First Responder Operations (FRO) Level II Responder Refresher (8 Hour) (Includes Downloadable ERG)', item: '0885-2192', price: 69.95, sale: false, category: 'OSHA Hazmat Emergency Responder Online' },
{ name: 'Hazardous Materials First Responder Operations (FRO) Level II Responder Refresher (4 Hour) (Includes Mailed ERG)', item: '0124-2170', price: 74.95, sale: false, category: 'OSHA Hazmat Emergency Responder Online' },
{ name: 'Hazardous Materials First Responder Operations (FRO) Level II Responder Refresher (4 Hour) (Includes Downloadable ERG)', item: '0886-2193', price: 59.95, sale: false, category: 'OSHA Hazmat Emergency Responder Online' },
{ name: 'Hazardous Materials First Responder Awareness (FRA) Level I Responder (Includes Mailed ERG)', item: '0090-2165', price: 64.95, sale: false, category: 'OSHA Hazmat Emergency Responder Online' },
{ name: 'Hazardous Materials First Responder Awareness (FRA) Level I Responder (Includes Downloadable ERG)', item: '0877-2186', price: 49.95, sale: false, category: 'OSHA Hazmat Emergency Responder Online' },
{ name: 'Hazardous Materials First Responder Awareness (FRA) Level I Responder Refresher (Includes Mailed ERG)', item: '0096-2167', price: 64.95, sale: false, category: 'OSHA Hazmat Emergency Responder Online' },
{ name: 'Hazardous Materials First Responder Awareness (FRA) Level I Responder Refresher (Includes Downloadable ERG)', item: '0872-2187', price: 49.95, sale: false, category: 'OSHA Hazmat Emergency Responder Online' },
{ name: 'Hazardous Materials First Responder Awareness (FRA) Level I Responder for Law Enforcement (Includes Mailed ERG)', item: '0868-2158', price: 64.95, sale: false, category: 'OSHA Hazmat Emergency Responder Online' },
{ name: 'Hazardous Materials First Responder Awareness (FRA) Level I Responder for Law Enforcement (Includes Downloadable ERG)', item: '0869-2183', price: 49.95, sale: false, category: 'OSHA Hazmat Emergency Responder Online' },
{ name: 'Using the Current Emergency Response Guidebook (Includes Mailed ERG)', item: '0115-2173', price: 34.95, sale: false, category: 'OSHA Hazmat Emergency Responder Online' },
{ name: 'Using the Current Emergency Response Guidebook (Includes Downloadable ERG)', item: '0113-2172', price: 19.95, sale: false, category: 'OSHA Hazmat Emergency Responder Online' },
{ name: 'Back Safety in the Workplace', item: '0125-1286', price: 24.95, sale: false, category: 'OSHA General Industry & Construction Online' },
{ name: 'Confined Space Awareness Training', item: '0114-1640', price: 19.95, sale: false, category: 'OSHA General Industry & Construction Online' },
{ name: 'Confined Space Awareness Training with Wallet ID Card', item: '0321-1641', price: 24.95, sale: false, category: 'OSHA General Industry & Construction Online' },
{ name: 'Fall Prevention for Construction', item: '0562-1769', price: 19.95, sale: false, category: 'OSHA General Industry & Construction Online' },
{ name: 'Hearing Conservation Training', item: '0095-1356', price: 19.95, sale: false, category: 'OSHA General Industry & Construction Online' },
{ name: 'Hearing Conservation Training with Wallet ID', item: '0338-1357', price: 24.95, sale: false, category: 'OSHA General Industry & Construction Online' },
{ name: 'Heat Illness Prevention for Employees', item: '0309-1199', price: 19.95, sale: false, category: 'OSHA General Industry & Construction Online' },
{ name: 'Heat Illness Prevention for Supervisors', item: '0310-1200', price: 24.95, sale: false, category: 'OSHA General Industry & Construction Online' },
{ name: 'Health and Safety Management', item: '0117-1327', price: 24.95, sale: false, category: 'OSHA General Industry & Construction Online' },
{ name: 'Introduction to Industrial Hygiene', item: '0330-1300', price: 14.95, sale: true, category: 'OSHA General Industry & Construction Online' },
{ name: 'Introduction to Job Hazard Analysis (JHA)', item: '0331-1303', price: 14.95, sale: true, category: 'OSHA General Industry & Construction Online' },
{ name: 'Personal Protective Equipment (PPE) Program and Selection', item: '0116-1318', price: 24.95, sale: false, category: 'OSHA General Industry & Construction Online' },
{ name: 'OSHA 40 Hour HAZWOPER - Online (Spanish)', item: '0104-1852', price: 210.0, sale: true, category: 'Spanish Courses Online' },
{ name: 'OSHA 32 Hour HAZWOPER - Online (Spanish)', item: '0107-2077', price: 225.0, sale: true, category: 'Spanish Courses Online' },
{ name: 'OSHA 24 Hour HAZWOPER - Online (Spanish)', item: '0108-1996', price: 150.0, sale: true, category: 'Spanish Courses Online' },
{ name: 'OSHA 16 Hour HAZWOPER - Online (Spanish)', item: '0109-2078', price: 122.5, sale: true, category: 'Spanish Courses Online' },
{ name: 'OSHA 8 Hour HAZWOPER Refresher - Online (Spanish)', item: '0111-1947', price: 39.95, sale: false, category: 'Spanish Courses Online' },
{ name: 'OSHA 8 Hour HAZWOPER Refresher With Wallet ID Card (Spanish)', item: '0112-1985', price: 44.95, sale: false, category: 'Spanish Courses Online' },
{ name: 'OSHA 8 Hour HAZWOPER Supervisor Refresher (Spanish)', item: '0142-2223', price: 39.95, sale: false, category: 'Spanish Courses Online' },
{ name: 'OSHA 8 Hour HAZWOPER Supervisor Refresher With Wallet ID Card (Spanish)', item: '0143-2224', price: 44.95, sale: false, category: 'Spanish Courses Online' },
{ name: 'Back Safety in the Workplace (Spanish)', item: '0176-1766', price: 24.95, sale: false, category: 'Spanish Courses Online' },
{ name: 'Hearing Conservation Training (Spanish)', item: '0796-2058', price: 19.95, sale: false, category: 'Spanish Courses Online' },
{ name: 'Hearing Conservation Training w/Wallet ID (Spanish)', item: '0797-2059', price: 24.95, sale: false, category: 'Spanish Courses Online' },
{ name: 'OSHA Hazard Communication Training Aligned with GHS with Wallet ID Card (Spanish)', item: '0281-1198', price: 23.96, sale: true, category: 'Spanish Courses Online' },
{ name: 'OSHA Hazard Communication Training Aligned with GHS (Spanish)', item: '0282-1197', price: 19.96, sale: true, category: 'Spanish Courses Online' },
{ name: 'OSHA Respiratory Protection Training (Spanish)', item: '0126-1471', price: 24.95, sale: false, category: 'Spanish Courses Online' },
{ name: 'OSHA Respiratory Protection Refresher Training (Spanish)', item: '0129-1472', price: 24.95, sale: false, category: 'Spanish Courses Online' },
{ name: 'Asbestos Awareness Online (Spanish)', item: '0345-1330', price: 19.95, sale: false, category: 'Spanish Courses Online' },
{ name: 'Asbestos Awareness Online With Wallet ID Card (Spanish)', item: '0346-1337', price: 24.95, sale: false, category: 'Spanish Courses Online' },
{ name: 'OSHA Hydrogen Sulfide (H2S) Awareness (Spanish)', item: '0181-1498', price: 19.95, sale: false, category: 'Spanish Courses Online' },
{ name: 'OSHA Hydrogen Sulfide (H2S) Awareness With Wallet ID Card (Spanish)', item: '0182-1742', price: 24.95, sale: false, category: 'Spanish Courses Online' },
{ name: 'Lead Awareness for General Industry Online (Spanish)', item: '0788-2056', price: 19.95, sale: false, category: 'Spanish Courses Online' },
{ name: 'Lead Awareness for General Industry Online with Wallet ID (Spanish)', item: '0789-2057', price: 24.95, sale: false, category: 'Spanish Courses Online' },
{ name: 'Silica Awareness for Construction Online (Spanish)', item: '0786-2053', price: 19.95, sale: false, category: 'Spanish Courses Online' },
{ name: 'Silica Awareness for Construction Online with Wallet ID Card (Spanish)', item: '0787-2054', price: 24.95, sale: false, category: 'Spanish Courses Online' },
{ name: 'Heat Illness Prevention for Employees (Spanish)', item: '0363-1359', price: 19.95, sale: false, category: 'Spanish Courses Online' },
{ name: 'Heat Illness Prevention for Supervisors (Spanish)', item: '0383-1403', price: 24.95, sale: false, category: 'Spanish Courses Online' },
{ name: 'Infantile Torticollis and Plagiocephaly', item: '0183-1887', price: 50.0, sale: false, category: 'Physical Therapy CE Training Online' },
{ name: 'Back Injuries:  Return To Work Programs and Safe Lifting Techniques', item: '0260-1382', price: 30.0, sale: true, category: 'Physical Therapy CE Training Online' },
{ name: 'A Parent\'s Guide to Torticollis & Plagiocephaly', item: '0515-1635', price: 30.0, sale: false, category: 'Physical Therapy CE Training Online' },
{ name: 'DOT Hazmat: General Awareness/Function Specific (10 Hour)', item: '0213-2222', price: 199.95, sale: false, category: 'DOT Hazmat Online' },
{ name: 'DOT Hazmat: Basic General Awareness (4 Hour)', item: '0212-1245', price: 74.95, sale: false, category: 'DOT Hazmat Online' },
{ name: 'DOT Hazmat: Security Awareness', item: '0215-1299', price: 49.95, sale: false, category: 'DOT Hazmat Online' },
{ name: 'DOT Hazmat: Function Specific - Hazard Classes and Divisions', item: '0329-1293', price: 49.95, sale: false, category: 'DOT Hazmat Online' },
{ name: 'DOT Hazmat: Function Specific - Labeling', item: '0218-1290', price: 49.95, sale: false, category: 'DOT Hazmat Online' },
{ name: 'DOT Hazmat: Function Specific - Marking', item: '0217-1288', price: 49.95, sale: false, category: 'DOT Hazmat Online' },
{ name: 'DOT Hazmat: Function Specific - Packaging', item: '0219-1292', price: 49.95, sale: false, category: 'DOT Hazmat Online' },
{ name: 'DOT Hazmat: Function Specific - Placarding', item: '0324-1291', price: 49.95, sale: false, category: 'DOT Hazmat Online' },
{ name: 'DOT Hazmat: Function Specific - Shipping Batteries', item: '0341-1325', price: 49.95, sale: false, category: 'DOT Hazmat Online' },
{ name: 'DOT Hazmat: Function Specific - Shipping Papers', item: '0220-1240', price: 49.95, sale: false, category: 'DOT Hazmat Online' },
{ name: 'DOT Hazmat: Function Specific - Using the Hazmat Table (HMT)', item: '0328-1285', price: 49.95, sale: false, category: 'DOT Hazmat Online' },
{ name: 'DOT Hazmat: Segregation - Highway', item: '0800-2074', price: 59.95, sale: false, category: 'DOT Hazmat Online' },
{ name: 'DOT Hazmat: Segregation - Air', item: '0801-2073', price: 59.95, sale: false, category: 'DOT Hazmat Online' },
{ name: 'DOT Hazmat: Segregation - Rail', item: '0802-2075', price: 59.95, sale: false, category: 'DOT Hazmat Online' },
{ name: 'DOT Hazmat: Segregation - Vessel', item: '0803-2080', price: 59.95, sale: false, category: 'DOT Hazmat Online' },
{ name: 'DOT Hazmat: Carrier Requirements - Air/IATA', item: '0203-1309', price: 49.95, sale: false, category: 'DOT Hazmat Online' },
{ name: 'DOT Hazmat: Carrier Requirements - Highway', item: '0205-1243', price: 49.95, sale: false, category: 'DOT Hazmat Online' },
{ name: 'DOT Hazmat: Carrier Requirements - Rail', item: '0204-1344', price: 49.95, sale: false, category: 'DOT Hazmat Online' },
{ name: 'DOT Hazmat: Carrier Requirements - Vessel', item: '0206-1345', price: 49.95, sale: false, category: 'DOT Hazmat Online' },
{ name: 'OSHA Hydrogen Sulfide (H2S) Awareness (2-hour OSHA H2S Awareness Online)', item: '0155-1397', price: 19.95, sale: false, category: 'Chemical Specific Online' },
{ name: 'OSHA Hydrogen Sulfide (H2S) Awareness Online with Wallet ID Card (2-hour OSHA H2S Awareness Online)', item: '0177-1396', price: 24.95, sale: false, category: 'Chemical Specific Online' },
{ name: 'OSHA/ANSI Hydrogen Sulfide (H2S) Awareness (4-hour OSHA/ANSI H2S Awareness Online)', item: '0897-2113', price: 29.95, sale: false, category: 'Chemical Specific Online' },
{ name: 'OSHA/ANSI Hydrogen Sulfide (H2S) Awareness (w/Wallet ID Card) (4-hour OSHA/ANSI H2S Awareness Online)', item: '0903-2114', price: 34.95, sale: false, category: 'Chemical Specific Online' },
{ name: 'OSHA/ANSI Hydrogen Sulfide (H2S) Certification (6-hour OSHA/ANSI H2S Certification Online)', item: '0909-2212', price: 39.95, sale: false, category: 'Chemical Specific Online' },
{ name: 'OSHA/ANSI Hydrogen Sulfide (H2S) Certification (w/Wallet ID Card) (6-hour OSHA/ANSI H2S Certification Online)', item: '0908-2228', price: 44.95, sale: false, category: 'Chemical Specific Online' },
{ name: 'Lead Safety for Refalsevation Repair and Painting (RRP) - Refresher', item: '0420-1296', price: 74.95, sale: false, category: 'Chemical Specific Online' },
{ name: 'Acrylonitrile Awareness Online', item: '0533-1685', price: 19.95, sale: false, category: 'Chemical Specific Online' },
{ name: 'Asbestos Awareness Online', item: '0208-1312', price: 19.95, sale: false, category: 'Chemical Specific Online' },
{ name: 'Asbestos Awareness Online with Wallet ID Card', item: '0209-1336', price: 24.95, sale: false, category: 'Chemical Specific Online' },
{ name: 'Benzene Awareness for General Industry and Construction', item: '0366-1360', price: 19.95, sale: false, category: 'Chemical Specific Online' },
{ name: 'Benzene Awareness for General Industry and Construction with Wallet ID', item: '0419-1467', price: 24.95, sale: false, category: 'Chemical Specific Online' },
{ name: 'Beryllium Awareness Online', item: '0832-2081', price: 19.95, sale: false, category: 'Chemical Specific Online' },
{ name: 'Cotton Dust Awareness', item: '0896-2210', price: 19.95, sale: false, category: 'Chemical Specific Online' },
{ name: '1,3-Butadiene Awareness Online', item: '0532-1673', price: 19.95, sale: false, category: 'Chemical Specific Online' },
{ name: 'Cadmium Awareness for Construction Online', item: '0520-1645', price: 19.95, sale: false, category: 'Chemical Specific Online' },
{ name: 'Cadmium Awareness for General Industry Online', item: '0523-1662', price: 19.95, sale: false, category: 'Chemical Specific Online' },
{ name: '13 Carcifalsegens Awareness Online', item: '0534-1700', price: 19.95, sale: false, category: 'Chemical Specific Online' },
{ name: 'Chromium (VI) Awareness Online', item: '0527-1665', price: 19.95, sale: false, category: 'Chemical Specific Online' },
{ name: 'Ethylene Oxide Awareness Online', item: '0519-1642', price: 19.95, sale: false, category: 'Chemical Specific Online' },
{ name: 'Formaldehyde Awareness Online', item: '0524-1661', price: 19.95, sale: false, category: 'Chemical Specific Online' },
{ name: 'Ifalserganic Arsenic Awareness for General Industry and Construction', item: '0441-1499', price: 19.95, sale: false, category: 'Chemical Specific Online' },
{ name: 'Lead Awareness for General Industry Online', item: '0287-1096', price: 19.95, sale: false, category: 'Chemical Specific Online' },
{ name: 'Lead Awareness for General Industry Online with Wallet ID', item: '0288-1142', price: 24.95, sale: false, category: 'Chemical Specific Online' },
{ name: 'Methylene Chloride Awareness', item: '0521-1646', price: 19.95, sale: false, category: 'Chemical Specific Online' },
{ name: 'Silica Awareness for Construction Online', item: '0349-1339', price: 19.95, sale: false, category: 'Chemical Specific Online' },
{ name: 'Silica Awareness for Construction Online with Wallet ID Card', item: '0350-1340', price: 24.95, sale: false, category: 'Chemical Specific Online' },
{ name: 'Silica Awareness for General Industry Online', item: '0831-2109', price: 19.95, sale: false, category: 'Chemical Specific Online' },
{ name: 'Vinyl Chloride Awareness', item: '0468-1532', price: 19.95, sale: false, category: 'Chemical Specific Online' },
{ name: '16 Hour EM-385-1-1 - Safety and Health Requirements for USACE', item: '0899-2226', price: 170.0, sale: true, category: 'USACE EM-385-1-1 Online' },
{ name: '24 Hour EM-385-1-1 - Safety and Health Requirements for USACE', item: '0898-2225', price: 235.0, sale: true, category: 'USACE EM-385-1-1 Online' },
{ name: '40 Hour EM-385-1-1 - Safety and Health Requirements for USACE', item: '0804-2133', price: 325.0, sale: true, category: 'USACE EM-385-1-1 Online' },
{ name: '8 Hour EM-385-1-1 - Safety and Health Requirements for USACE', item: '0900-2227', price: 125.0, sale: true, category: 'USACE EM-385-1-1 Online' }
];

  let isMinimized = false;
  let selectedCourse = null;
  let selectedQty = 10;
  let selectedTiers = "0";
  let filterText = '';
  let selectedSummary = [];
  let selectedTables = [];
  let initInterval = null;

  function createPanel() {
    const panel = document.createElement('div');
    panel.id = 'vp-ul-panel';
    panel.style = `
      position: fixed; top: 97px; right: 50px; width: 887px; max-height: 80vh;
      background: #fff; border: 2px solid #444; border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-family: Tahoma, sans-serif;
      font-size: 10pt; z-index: 10000; overflow: auto;
      display: flex;
      flex-direction: column;
    `;

    panel.innerHTML = `
      <div id="vp-header" style="background:#2b7cd3;color:white;padding:8px 10px; display:flex; justify-content:space-between; align-items:center;">
        <span><strong>Volume Pricing</strong></span>
        <button id="vp-toggle" style="background:none; border:none; color:white; font-size:16px; cursor:pointer;">&#x2212;</button>
      </div>
      <div id="vp-controls" style="padding:10px; background: #f0f4ff; border-bottom: 1px solid #ccc; position: sticky; top: 0; z-index: 10; display: flex; gap: 15px; align-items: center;">
        <label><b>Search:</b> <input type="search" id="vp-search" placeholder="Search courses..." style="padding:4px 6px; font-size:14px; border:1px solid #ccc; border-radius:4px; width: 250px;" /></label>
        <label><b>Quantity:</b> <input type="number" id="vp-qty" value="${selectedQty}" min="1" style="width:60px; padding:2px 5px; font-size:14px;" /></label>
        <label><b>Additional Discount Tiers:</b>
          <select id="vp-tiers" style="font-size:14px; padding:2px 4px;">
            <option value="0" selected>0</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        </label>
        <button id="vp-clear-summary" style="margin-left:auto; padding:4px 10px; background:#c00; color:white; border:none; border-radius:4px; cursor:pointer;">Clear AP Summary</button>
      </div>
      <div id="vp-body" style="padding:10px; overflow-y: auto; flex-grow: 1;">
        <div id="vp-result" style="margin-bottom:15px;"></div>
        <div id="vp-summary" style="margin-bottom:15px;"></div>
        <div id="vp-courses"></div>
      </div>
    `;
    document.body.appendChild(panel);

    document.getElementById('vp-toggle').onclick = () => {
      isMinimized = !isMinimized;
      const bodyEl = document.getElementById('vp-body');
      bodyEl.style.display = isMinimized ? 'none' : 'block';
      document.getElementById('vp-controls').style.display = isMinimized ? 'none' : 'flex';
      document.getElementById('vp-toggle').innerHTML = isMinimized ? '&#x2b;' : '&#x2212;';
    };

    document.getElementById('vp-qty').addEventListener('input', e => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val) && val > 0) selectedQty = val;
    });

    document.getElementById('vp-tiers').addEventListener('change', e => {
      selectedTiers = e.target.value;
    });

    document.getElementById('vp-search').addEventListener('input', e => {
      filterText = e.target.value.trim().toLowerCase();
      renderCourses();
    });

    document.getElementById('vp-clear-summary').addEventListener('click', () => {
      selectedSummary = [];
      selectedTables = [];
      document.getElementById('vp-summary').innerHTML = '';
      document.getElementById('vp-result').innerHTML = '';
    });
  }

  function renderCourses() {
    const container = document.getElementById('vp-courses');
    if (!container) return;

    const grouped = {};
    courseData.forEach(c => {
      if (!grouped[c.category]) grouped[c.category] = [];
      grouped[c.category].push(c);
    });

    let html = '';
    for (const [category, list] of Object.entries(grouped)) {
      const filteredList = list.filter(c => c.name.toLowerCase().includes(filterText));
      if (filteredList.length === 0) continue;

      html += `<div style="margin-top:10px;">
        <div style="background:#0066cc;color:white;padding:5px 10px;border-radius:4px 4px 0 0;">${category}</div>
        <table style="width:100%;table-layout:fixed;border-collapse:collapse;">
          <colgroup>
            <col style="width:60%;">
            <col style="width:20%;">
            <col style="width:20%;">
          </colgroup>
          <thead>
            <tr>
              <th style="text-align:left; padding:5px;">Course Name</th>
              <th style="text-align:left; padding:5px;">Price</th>
              <th style="text-align:center; padding:5px;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${filteredList.map(c => `
              <tr style="background:${selectedCourse === c.name ? '#d3e9ff' : '#f9f9f9'}">
                <td style="padding:5px;">${c.name}</td>
                <td style="padding:5px; vertical-align: top;">
                  <div style="display:flex; justify-content:space-between; align-items: flex-start;">
                    <span style="line-height:1.3;">$${c.price.toFixed(2)}</span>
                    <span style="color:green; line-height:1.3;">${c.sale ? '(Sale)' : ''}</span>
                  </div>
                </td>
                <td style="padding:5px; text-align:center;">
                  <button
                    class="vp-select-btn"
                    style="padding:4px 8px; cursor:pointer; border-radius:4px; border:none; font-weight:bold;
                           background:${selectedCourse === c.name ? '#2b7cd3' : '#eee'};
                           color:${selectedCourse === c.name ? 'white' : 'black'};"
                    onclick="selectVP('${c.name.replace(/'/g, "\\'")}')"
                  >Select</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
    }

    container.innerHTML = html || '<div style="font-style:italic; color:#888; padding:10px;">No courses found.</div>';
  }

  window.selectVP = function (courseName) {
    const course = courseData.find(c => c.name === courseName);
    if (!course) return;
    selectedCourse = course.name;

    const el = document.querySelector('[ng-model="vpc.InObj.NumberCourses"]');
    if (!el) return alert('Volume Pricing input not found on page!');
    const scope = window.angular.element(el).scope();
    scope.vpc.ChangeType(course.price <= 100 ? 'under100' : (course.sale ? 'sale' : 'regular'));
    scope.vpc.InObj.NumberCourses = selectedQty;
    scope.vpc.InObj.RegularPrice = course.price;
    scope.vpc.InObj.PlusRows = selectedTiers;
    scope.$apply();
    scope.vpc.Calculate();

    setTimeout(() => {
      const h3s = Array.from(document.querySelectorAll('h3'));
      let quoteTable = null;
      for (const h3 of h3s) {
        if (h3.textContent.trim() === 'Quoted Amount') {
          let next = h3.nextElementSibling;
          while (next && next.tagName !== 'TABLE') next = next.nextElementSibling;
          if (next) quoteTable = next;
          break;
        }
      }

      if (quoteTable) {
        const cloned = quoteTable.cloneNode(true);
        cloned.style.width = '100%';
        cloned.style.marginTop = '10px';
        cloned.style.borderCollapse = 'collapse';
        cloned.style.border = '1px solid #ccc';

        cloned.querySelectorAll('th, td').forEach(cell => {
          cell.style.textAlign = 'center';
          cell.style.border = '1px solid #ccc';
          cell.style.padding = '6px';
        });

        // Update column headers
        const headerRow = cloned.querySelector('thead tr');
        if (headerRow) {
          const headers = [
            'Quantity',
            '% Total',
            'Disc./Course',
            'Price/Course',
            'Disc. Total',
            'Reg. Total',
            'Savings'
          ];
          const ths = headerRow.querySelectorAll('th');
          headers.forEach((text, i) => {
            if (ths[i]) ths[i].textContent = text;
          });
        }

        selectedTables.push({ course, table: cloned });

        const resultDiv = document.getElementById('vp-result');
        resultDiv.innerHTML = '';
        selectedTables.forEach(({ course, table }) => {
          const wrapper = document.createElement('div');
          wrapper.style.marginBottom = '20px';
          wrapper.innerHTML = `<strong>${course.name}</strong><br>Item # ${course.item}<br>Regular Price: $${course.price.toFixed(2)}<br>`;
          wrapper.appendChild(table);
          resultDiv.appendChild(wrapper);
        });

        const rows = quoteTable.querySelectorAll('tbody tr');
        let matchedRow = null;
        rows.forEach(row => {
          const q = parseInt(row.querySelector('td')?.textContent.trim(), 10);
          if (q === selectedQty) matchedRow = row;
        });

        if (matchedRow) {
          const cells = matchedRow.querySelectorAll('td');
          const qty = parseInt(cells[0].textContent.trim(), 10);
          const unitPrice = parseFloat(cells[3].textContent.trim().replace('$', ''));
          const total = (qty * unitPrice).toFixed(2);
          selectedSummary.push(`${qty} – ${course.name} Item # ${course.item} @ $${unitPrice.toFixed(2)} each = $${total}`);
        } else {
          selectedSummary.push(`${selectedQty} – ${course.name} Item # ${course.item} (quantity not found in table)`);
        }

        document.getElementById('vp-summary').innerHTML = selectedSummary.map(s => `<div>${s}</div>`).join('');
      } else {
        document.getElementById('vp-result').innerHTML = '<em>Quoted Amount not found.</em>';
      }

      renderCourses();
    }, 300);
  };

  function isVolumePricingSummaryPage() {
    return window.location.href.includes('#/volume-pricing/summary');
  }

  function startVolumePricingUI() {
    initInterval = setInterval(() => {
      if (document.querySelector('[ng-model="vpc.InObj.NumberCourses"]')) {
        clearInterval(initInterval);
        initInterval = null;
        createPanel();
        renderCourses();
      }
    }, 500);
  }

  function handleURLChange() {
    const panel = document.getElementById('vp-ul-panel');
    if (isVolumePricingSummaryPage()) {
      if (!panel) startVolumePricingUI();
    } else {
      if (panel) panel.remove();
      if (initInterval) clearInterval(initInterval);
      selectedCourse = null;
      filterText = '';
      selectedQty = 10;
      selectedTiers = "3";
      selectedSummary = [];
      selectedTables = [];
    }
  }

  function hookHistoryMethod(methodName) {
    const original = history[methodName];
    return function () {
      const result = original.apply(this, arguments);
      window.dispatchEvent(new Event('locationchange'));
      return result;
    };
  }

  history.pushState = hookHistoryMethod('pushState');
  history.replaceState = hookHistoryMethod('replaceState');

  window.addEventListener('popstate', () => window.dispatchEvent(new Event('locationchange')));
  window.addEventListener('hashchange', () => window.dispatchEvent(new Event('locationchange')));
  window.addEventListener('locationchange', handleURLChange);

  handleURLChange();
})();
