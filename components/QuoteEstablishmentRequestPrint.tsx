
import React from 'react';
import { WorkRequest, RequestStatus, CommercialAgency, Centre, ValidationType } from '../types';

interface QuoteEstablishmentRequestPrintProps {
  request: WorkRequest;
  agency?: CommercialAgency;
  centre?: Centre;
  onClose: () => void;
}

export const QuoteEstablishmentRequestPrint: React.FC<QuoteEstablishmentRequestPrintProps> = ({ 
  request, 
  agency, 
  centre, 
  onClose 
}) => {
  const handlePrint = () => {
    window.print();
  };

  // Calculer les validations complètes
  const allValidationsComplete = request.validations && 
    request.validations.filter(v => v.status === 'validated').length >= 3;

  return (
    <div className="fixed inset-0 z-[100] bg-white overflow-y-auto print:static print:bg-white">
      {/* Controls - Hidden during print */}
      <div className="sticky top-0 bg-gray-900 text-white p-4 flex justify-between items-center print:hidden shadow-xl">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <h2 className="font-black uppercase tracking-widest text-sm">DEMANDE D'ÉTABLISSEMENT DE DEVIS - {request.id}</h2>
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
      <div id="quote-print-container" className="relative max-w-[210mm] mx-auto bg-white text-black min-h-[297mm] p-10 print:p-0 print:m-0 print:w-[210mm]" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <style>
          {`
            @media print {
              @page { size: A4 portrait; margin: 15mm; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
              body * { visibility: hidden; }
              #quote-print-container, #quote-print-container * { visibility: visible; }
              #quote-print-container { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
            }
          `}
        </style>

        {/* En-tête (3 colonnes) */}
        <div className="flex justify-between items-start mb-6 text-[13px] leading-tight text-black">
          <div className="text-center w-1/3">
            <div>ALGERIENNE DES EAUX</div>
            <div>Zone d'Alger</div>
            <div>Unité de {centre?.name || 'Médéa'}</div>
          </div>
          <div className="flex justify-center w-1/3">
            <img src="/ade.png" alt="ADE Logo" className="h-20 w-auto object-contain" />
          </div>
          <div className="text-right w-1/3 pt-2">
            <span>Agence de : </span><span className="font-bold uppercase text-[14px]">{agency?.name || 'BERROUAGHIA'}</span>
          </div>
        </div>

        {/* Titre */}
        <div className="text-center mb-6 px-4">
          <h1 className="text-[17px] font-bold uppercase tracking-tight text-black border-b-[12px] border-black pb-2 inline-block w-full">
            DEMANDE D'ETABLISSEMENT DE DEVIS QUANTITATIF ET ESTIMATIF
          </h1>
        </div>

        {/* N° et Date */}
        <div className="flex justify-between mb-8 text-[13px] px-2 text-black">
          <div className="flex items-center">
            <span className="mr-2">N° d'enregistrement de la demande : </span>
            <span className="font-mono tracking-widest">{request.id || '!___!___!___!___!___!'}</span>
          </div>
          <div className="flex items-center">
            <span className="mr-4">Date</span>
            <span className="font-mono tracking-widest">
              {request.createdAt ? new Date(request.createdAt).toLocaleDateString('fr-DZ') : '!___!___! / !___!___! / !___!___!___!___!'}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <div className="px-2 space-y-5 text-[12px] text-black">
          
          <div className="font-bold mb-4 text-[11px]">
            Veuillez établir un devis quantitatif et estimatif pour :
          </div>

          {(() => {
            const names = request.clientName ? request.clientName.trim().split(' ') : [''];
            const nom = request.businessName || (names.length > 1 ? names[0] : request.clientName);
            const prenom = request.businessName ? '' : (names.length > 1 ? names.slice(1).join(' ') : '');
            
            return (
              <>
                <div className="flex items-end">
                  <span className="mr-2 whitespace-nowrap">Nom (ou Raison sociale)</span>
                  <div className="flex-grow border-b border-gray-400 relative h-5">
                    <span className="absolute bottom-0 left-4 font-bold">{nom}</span>
                  </div>
                </div>
                <div className="flex items-end">
                  <span className="mr-2 whitespace-nowrap">Prénom</span>
                  <div className="flex-grow border-b border-gray-400 relative h-5">
                    <span className="absolute bottom-0 left-4 font-bold">{prenom}</span>
                  </div>
                </div>
              </>
            );
          })()}

          <div className="pt-4 space-y-4">
            <div className="underline font-bold mb-2 text-[12px]">Adresse de branchement :</div>
            <div className="flex items-end mb-2">
              <span className="mr-2 whitespace-nowrap">Rue</span>
              <div className="flex-grow border-b border-gray-400 relative h-5">
                <span className="absolute bottom-0 left-4 font-bold">{request.installationAddress}</span>
              </div>
            </div>
            <div className="flex items-end">
              <span className="mr-2 whitespace-nowrap">Commune</span>
              <div className="flex-grow border-b border-gray-400 relative h-5">
                <span className="absolute bottom-0 left-4 font-bold">{request.installationCommune}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-4">
            <div className="underline font-bold mb-2 text-[12px]">Adresse de correspondance:</div>
            <div className="flex items-end mb-2">
              <span className="mr-2 whitespace-nowrap">Rue</span>
              <div className="flex-grow border-b border-gray-400 relative h-5">
                <span className="absolute bottom-0 left-4 font-bold">{request.address || request.installationAddress}</span>
              </div>
            </div>
            <div className="flex items-end mb-2">
              <span className="mr-2 whitespace-nowrap">Commune</span>
              <div className="flex-grow border-b border-gray-400 relative h-5">
                <span className="absolute bottom-0 left-4 font-bold">{request.commune || request.installationCommune}</span>
              </div>
            </div>
            <div className="flex items-end">
              <span className="mr-2 whitespace-nowrap">Tél</span>
              <div className="flex-grow border-b border-gray-400 relative h-5">
                <span className="absolute bottom-0 left-4 font-bold">{request.correspondencePhone || request.clientPhone}</span>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <div className="underline font-bold mb-8 text-[12px]">Nature des travaux demandés :</div>
            <div className="w-full border-b border-gray-400 relative h-6">
              <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 font-bold text-[13px]">{request.serviceType}</span>
            </div>
          </div>

        </div>

        {/* Visas */}
        <div className="mt-12 px-2 w-full pb-8">
          <table className="w-full border-collapse border-[2px] border-black text-center text-sm table-fixed" style={{ border: '2px solid black' }}>
            <thead>
              <tr style={{ backgroundColor: '#808080' }}>
                <th colSpan={3} className="py-1 border-b-[2px] border-black" style={{ borderBottom: '2px solid black' }}>
                  <span className="text-white uppercase font-bold tracking-widest text-[12px]">VISAS</span>
                </th>
              </tr>
              <tr className="bg-white text-black border-b-[2px] border-black" style={{ borderBottom: '2px solid black' }}>
                <th className="py-2 border-r-[2px] border-black w-1/3 text-[11px] font-bold" style={{ borderRight: '2px solid black' }}>Chef de Section « Clientèle »</th>
                <th className="py-2 border-r-[2px] border-black w-1/3 text-[11px] font-bold" style={{ borderRight: '2px solid black' }}>Juriste</th>
                <th className="py-2 w-1/3 text-[11px] font-bold">Chef d'Agence Commerciale</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="h-32 border-r-[2px] border-black" style={{ borderRight: '2px solid black' }}></td>
                <td className="h-32 border-r-[2px] border-black" style={{ borderRight: '2px solid black' }}></td>
                <td className="h-32"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
