import React from 'react';
import { WorkRequest, CommercialAgency, Centre } from '../types';

interface WorkRequestAcknowledgementProps {
  request: WorkRequest;
  agency?: CommercialAgency;
  centre?: Centre;
  onClose: () => void;
}

export const WorkRequestAcknowledgement: React.FC<WorkRequestAcknowledgementProps> = ({ request, agency, centre, onClose }) => {
  React.useEffect(() => {
    // Déclenchement automatique de l'impression
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Séparation Nom / Prénom plus intelligente
  const getNames = () => {
    if (request.businessName) return { nom: request.businessName.toUpperCase(), prenom: '---' };
    const parts = request.clientName.trim().split(/\s+/);
    if (parts.length === 1) return { nom: parts[0].toUpperCase(), prenom: '---' };
    return { 
      nom: parts[0].toUpperCase(), 
      prenom: parts.slice(1).join(' ') 
    };
  };

  const { nom, prenom } = getNames();
  const dateFormatted = new Date(request.createdAt).toLocaleDateString('fr-DZ');

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto print:static print:bg-white font-serif">
      {/* Configuration d'impression spécifique */}
      <style>
        {`
          @media print {
            body { 
              margin: 0; 
              padding: 0; 
              background: white; 
            }
            @page { 
              size: auto; /* Laisse le navigateur gérer le A4 */
              margin: 0; 
            }
            .print-container { 
              display: flex !important; 
              justify-content: center !important; 
              align-items: flex-start !important; 
              padding-top: 20mm !important; 
              width: 100%;
            }
          }
        `}
      </style>

      {/* Controls - Hidden during print */}
      <div className="sticky top-0 bg-slate-900 text-white p-4 flex justify-between items-center print:hidden shadow-xl font-sans">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div className="space-y-1">
            <h2 className="font-black uppercase tracking-widest text-[10px]">Format compact : 110mm x 90mm</h2>
            <p className="text-[8px] text-slate-400 font-bold uppercase italic">Utilisez une feuille A4 standard pour l'impression, puis découpez suivant les pointillés.</p>
          </div>
        </div>
        <button 
          onClick={handlePrint}
          className="bg-emerald-600 hover:bg-emerald-700 px-6 py-2 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Imprimer
        </button>
      </div>

      {/* Document Root Container */}
      <div className="print-container min-h-screen py-12 flex justify-center bg-slate-100/50 print:bg-white print:py-0">
        
        {/* The Actual Receipt Box - 110mm x 90mm */}
        <div className="w-[110mm] h-[90mm] bg-white border border-dashed border-gray-400 p-4 relative overflow-hidden shadow-2xl print:shadow-none mb-10">
          
          {/* Republic Text */}
          <div className="text-center font-bold text-[7px] mb-1">
            الجمهورية الجزائرية الديمقراطية الشعبية
          </div>

          {/* Header Section */}
          <div className="flex justify-between items-center mb-3">
            <div className="text-[7px] font-bold text-left leading-tight w-1/3">
              Ministère des ressources en eau<br />
              E.P ALGERIENNE DES EAUX
            </div>
            <div className="flex flex-col items-center w-1/3">
              <img src="/ade.png" alt="ADE Logo" className="h-8 w-auto object-contain" />
            </div>
            <div className="text-[7px] font-bold text-right leading-tight w-1/3" dir="rtl">
              وزارة المــــوارد المائيــــــة<br />
              الجزائريــــــة للميــــــــــاه
            </div>
          </div>

          {/* Ref Box Style (Very Compact for Receipt) */}
          <div className="bg-gray-100 border border-gray-400 p-1 mb-2 text-center">
            <div className="font-bold text-[8px]">
              Zone d'Alger - Unité de {centre?.name || 'Médéa'}
            </div>
          </div>

          {/* Agency Line */}
          <div className="mb-2 flex items-baseline gap-1">
            <span className="text-[9px] font-bold whitespace-nowrap">Agence de {agency?.name || '........................'}</span>
          </div>

          {/* Title Section */}
          <div className="text-center mb-4">
            <div className="inline-flex items-baseline gap-1.5">
              <h2 className="text-[11px] font-bold uppercase tracking-tight">Accusé de réception N°</h2>
              <span className="text-[11px] font-bold border-b border-black px-2 min-w-[100px]">
                {request.id}
              </span>
            </div>
          </div>

          {/* Data Fields Section */}
          <div className="space-y-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[9px] font-bold min-w-[35px]">Nom :</span>
              <span className="flex-1 border-b border-black text-[9px] font-medium">
                {nom}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-[9px] font-bold min-w-[35px]">Prénom :</span>
              <span className="flex-1 border-b border-black text-[9px] font-medium">
                {prenom}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-[9px] font-bold min-w-[35px]">Adresse :</span>
              <span className="flex-1 border-b border-black text-[9px] font-medium leading-tight">
                {request.address || request.installationAddress}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-[9px] font-bold min-w-[85px] whitespace-nowrap">Nature de la doléance :</span>
              <span className="flex-1 border-b border-black text-[9px] font-medium text-blue-800 leading-tight">
                {request.serviceType}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-[9px] font-bold min-w-[85px] whitespace-nowrap">Date de réception :</span>
              <span className="border-b border-black text-[10px] px-2 font-bold min-w-[100px]">
                {dateFormatted}
              </span>
            </div>
          </div>

          {/* Signature Section */}
          <div className="absolute bottom-4 right-4 text-right">
            <p className="text-[8px] font-bold underline underline-offset-2 italic">Le responsable commercial :</p>
          </div>

          {/* ID Identifier (Side text or absolute) */}
          <div className="absolute bottom-1 left-2 opacity-20 text-[6px] font-sans">
            ID: {request.id}
          </div>
        </div>
      </div>
    </div>
  );
};
