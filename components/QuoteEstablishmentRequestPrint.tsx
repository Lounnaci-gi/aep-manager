
import React from 'react';
import { WorkRequest, RequestStatus, CommercialAgency, Centre, ValidationType, Unit } from '../types';

interface QuoteEstablishmentRequestPrintProps {
  request: WorkRequest;
  agency?: CommercialAgency;
  centre?: Centre;
  unit?: Unit;
  onClose: () => void;
}

export const QuoteEstablishmentRequestPrint: React.FC<QuoteEstablishmentRequestPrintProps> = ({ 
  request, 
  agency, 
  centre, 
  unit,
  onClose 
}) => {
  const handlePrint = () => {
    window.print();
  };

  // Helper to render boxed digits
  const renderDigitBoxes = (text: string, length: number) => {
    const chars = text.padEnd(length, '_').split('');
    return (
      <div className="flex gap-1 items-center">
        {chars.map((char, i) => {
          // Ignorer complètement le caractère '/'
          if (char === '/') {
            return null;
          }
          return (
            <div key={i} className="w-5 h-6 border-[1.5px] border-black flex items-center justify-center text-[13px]" style={{ fontFamily: 'Arial' }}>
              {char === '_' ? '' : char}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white overflow-y-auto print:static print:bg-white">
      {/* Controls - Hidden during print */}
      <div className="sticky top-0 bg-gray-900 text-white p-4 flex justify-between items-center print:hidden shadow-xl">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <h2 className="font-black uppercase tracking-widest text-sm text-white">DEMANDE D'ÉTABLISSEMENT DE DEVIS - {request.id}</h2>
        </div>
        <button 
          onClick={handlePrint}
          className="bg-emerald-600 hover:bg-emerald-700 px-6 py-2 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Imprimer le Devis
        </button>
      </div>

      {/* Document Content - Format A4 */}
      <div id="quote-print-container" className="relative max-w-[210mm] mx-auto bg-white text-black min-h-[277mm] p-10 print:p-0 print:m-0 print:w-[210mm]">
        <style>
          {`
            @media print {
              @page { size: A4 portrait; margin: 10mm; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
              body * { visibility: hidden; }
              #quote-print-container, #quote-print-container * { visibility: visible; }
              #quote-print-container { 
                position: absolute; 
                left: 0; 
                top: 0; 
                width: 100%; 
                margin: 0; 
                padding: 10mm !important;
                height: 277mm !important;
                overflow: hidden !important;
              }
            }
            #quote-print-container {
              font-family: Arial, Helvetica, sans-serif;
              color: #000;
              line-height: 1.25;
            }
            #quote-print-container .field-line {
              border-bottom: 1.5px solid #000;
              min-height: 18px;
              display: inline-block;
              padding: 0 4px;
              text-transform: uppercase;
              text-align: center;
            }
          `}
        </style>

        {/* 1. Official Header (Match Image & WorkRequestPrint font sizes) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <div style={{ textAlign: 'center', lineHeight: 1.2, width: '33%' }}>
            <div style={{ fontSize: '12pt' }}>E.P ALGERIENNE DES EAUX</div>
            <div style={{ fontSize: '12pt' }}>Unité de {unit?.name || 'Médéa'}</div>
            <div style={{ fontSize: '12pt' }}>Zone d'Alger</div>
          </div>
          
          <div style={{ textAlign: 'center', width: '33%' }}>
            <img src="/ade.png" alt="ADE Logo" style={{ height: '100px', margin: '0 auto' }} />
          </div>

          <div style={{ textAlign: 'right', width: '33%', fontSize: '12pt' }}>
            Agence de : {agency?.name || '........................'}
          </div>
        </div>

        {/* 2. Title Section */}
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <h1 style={{ fontSize: '14pt', margin: '0 0 4px 0', fontWeight: 'bold', fontFamily: 'Arial, Helvetica, sans-serif', whiteSpace: 'nowrap' }}>
            DEMANDE D'ETABLISSEMENT DE DEVIS QUANTITATIF ET ESTIMATIF
          </h1>
          <div style={{ height: '15px', backgroundColor: '#000', width: '100%', paddingBottom: '15px' }}></div>
        </div>

        {/* 3. Registration Box Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '10pt', alignItems: 'center', padding: '0 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span>N° d'enregistrement de la demande :</span>
            {renderDigitBoxes(request.id || '', request.id?.length || 12)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '16px'}}>Date</span>
            <div style={{ display: 'flex', gap: '0px', alignItems: 'center' }}>
              {renderDigitBoxes(new Date(request.createdAt).getDate().toString().padStart(2, '0'), 2)}
              {renderDigitBoxes((new Date(request.createdAt).getMonth() + 1).toString().padStart(2, '0'), 2)}
              {renderDigitBoxes(new Date(request.createdAt).getFullYear().toString(), 4)}
            </div>
          </div>
        </div>

        {/* 4. Form Body */}
        <div style={{ padding: '0 8px', fontSize: '10pt', lineHeight: '1.5' }}>
          
          <div style={{marginBottom: '12px', fontSize: '12pt' }}>
            Veuillez établir un devis quantitatif et estimatif pour :
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: '8px' }}>
              <span style={{ marginRight: '8px', whiteSpace: 'nowrap' }}><span style={{ textDecoration: 'underline' }}>Nom</span> (ou Raison sociale)</span>
              <div className="field-line" style={{ flexGrow: 1, fontWeight: 'normal' }}>
                {request.businessName || request.clientName?.split(' ')[0]}
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <span style={{ marginRight: '8px', whiteSpace: 'nowrap' }}>Prénom</span>
              <div className="field-line" style={{ flexGrow: 1 }}>
                {request.businessName ? '' : request.clientName?.split(' ').slice(1).join(' ')}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <div style={{ textDecoration: 'underline', marginBottom: '6px', fontSize: '10.5pt' }}>Adresse de branchement :</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: '6px' }}>
              <span style={{ marginRight: '8px', whiteSpace: 'nowrap' }}>Rue</span>
              <div className="field-line" style={{ flexGrow: 1 }}>
                {request.installationAddress}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <span style={{ marginRight: '8px', whiteSpace: 'nowrap' }}>Commune</span>
              <div className="field-line" style={{ flexGrow: 1 }}>
                {request.installationCommune}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <div style={{ textDecoration: 'underline', marginBottom: '6px', fontSize: '10.5pt' }}>Adresse de correspondance :</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: '6px' }}>
              <span style={{ marginRight: '8px', whiteSpace: 'nowrap' }}>Rue</span>
              <div className="field-line" style={{ flexGrow: 1 }}>
                {request.address || request.installationAddress}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: '6px' }}>
              <span style={{ marginRight: '8px', whiteSpace: 'nowrap' }}>Commune</span>
              <div className="field-line" style={{ flexGrow: 1 }}>
                {request.commune || request.installationCommune}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', width: '50%' }}>
              <span style={{ marginRight: '8px', whiteSpace: 'nowrap' }}>Tél</span>
              <div className="field-line" style={{ flexGrow: 1 }}>
                {request.correspondencePhone || request.clientPhone}
              </div>
            </div>
          </div>

          <div style={{ paddingTop: '5px' }}>
            <div style={{ textDecoration: 'underline', marginBottom: '8px', fontSize: '11pt' }}>Nature des travaux demandés :</div>
            <div style={{ borderBottom: '1.5px solid #000', height: '30px', position: 'relative', width: '100%' }}>
              <span style={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', fontSize: '11pt', textTransform: 'uppercase', color: '#000' }}>{request.serviceType}</span>
            </div>
          </div>

        </div>

        {/* 5. Visas Section (Match Image) */}
        <div style={{ marginTop: 'auto', paddingTop: '40px', paddingLeft: '3px', paddingRight: '3px', width: 'calc(100% + 10mm)' }}>
          <table style={{ width: '95%', borderCollapse: 'collapse', border: '1px solid #000', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ backgroundColor: '#5f5d5dff', color: '#fff' }}>
                <th colSpan={3} style={{ padding: '1px 0', borderBottom: '1px solid #000', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '11pt', textAlign: 'center' }}>
                  VISAS
                </th>
              </tr>
              <tr style={{ backgroundColor: '#fff', color: '#000', borderBottom: '1px solid #000' }}>
                <th style={{ padding: '2px', borderRight: '1px solid #000', fontSize: '9pt', width: '33.33%', textAlign: 'center' }}>Chef de Section « Clientèle »</th>
                <th style={{ padding: '2px', borderRight: '1px solid #000', fontSize: '9pt', width: '33.33%', textAlign: 'center' }}>Juriste</th>
                <th style={{ padding: '2px', fontSize: '9pt', width: '33.33%', textAlign: 'center' }}>Chef d'Agence Commerciale</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ height: '100px', borderRight: '1px solid #000', padding: '6px', verticalAlign: 'top' }}></td>
                <td style={{ height: '100px', borderRight: '1px solid #000', padding: '6px', verticalAlign: 'top' }}></td>
                <td style={{ height: '100px', padding: '6px', verticalAlign: 'top' }}></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Print Disclaimer (Invisible) */}
        <div className="hidden print:block fixed bottom-4 right-4 italic text-[8pt] text-gray-400">
           Document généré le {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
};
