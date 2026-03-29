
import React from 'react';
import { WorkRequest, RequestStatus, CommercialAgency, Centre, BranchementType, ValidationType } from '../types';

interface WorkRequestPrintProps {
  request: WorkRequest;
  agency?: CommercialAgency;
  centre?: Centre;
  onClose: () => void;
}

export const WorkRequestPrint: React.FC<WorkRequestPrintProps> = ({ request, agency, centre, onClose }) => {
  const handlePrint = () => {
    window.print();
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
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <h2 className="font-black uppercase tracking-widest text-sm">Aperçu de la Demande - {request.id}</h2>
        </div>
        <button 
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Imprimer
        </button>
      </div>

      {/* Document Content */}
      <div className="max-w-[210mm] mx-auto p-8 md:p-16 bg-white text-gray-900 print:p-0 print:m-0">
        {/* Header */}
        <div className="flex justify-between items-start border-b-4 border-gray-900 pb-8 mb-10">
          <div className="flex items-center gap-6">
            <img src="/ade.png" alt="ADE Logo" className="h-24 w-auto object-contain" />
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-blue-700 tracking-tighter uppercase leading-none">ALGÉRIENNE DES EAUX</h1>
              <p className="text-sm font-black text-gray-500 uppercase tracking-widest">Unité de {centre?.name || '---'}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Agence : {agency?.name || '---'}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block border-4 border-gray-900 px-6 py-2 mb-4">
              <h2 className="text-2xl font-black uppercase tracking-tighter">DEMANDE DE TRAVAUX</h2>
            </div>
            <p className="text-sm font-black text-gray-900 uppercase">Réf : <span className="text-blue-700">{request.id}</span></p>
            <p className="text-xs font-bold text-gray-500 uppercase mt-1">Date : {new Date(request.createdAt).toLocaleDateString('fr-DZ')}</p>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-10">
          {/* Section 1: Client */}
          <section>
            <h3 className="text-sm font-black bg-gray-100 px-4 py-2 border-l-8 border-blue-700 uppercase tracking-widest mb-4">1. ÉTAT CIVIL DE L'ABONNÉ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
              <div className="space-y-3">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nom et Prénom / Raison Sociale</span>
                  <span className="text-lg font-black uppercase text-gray-900">
                    {request.businessName || `${request.civility} ${request.clientName}`}
                  </span>
                </div>
                {request.idDocumentNumber && (
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pièce d'Identité</span>
                    <span className="text-sm font-bold text-gray-700">
                      {request.idDocumentType} N° {request.idDocumentNumber} (le {request.idDocumentIssueDate} par {request.idDocumentIssuer})
                    </span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Qualité</span>
                  <span className="text-sm font-bold text-gray-700">{request.type}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Adresse de correspondance</span>
                  <span className="text-sm font-bold text-gray-700 uppercase">{request.address}, {request.commune}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Coordonnées</span>
                  <span className="text-sm font-bold text-gray-700">Tél : {request.clientPhone}</span>
                  {request.clientEmail && <span className="text-sm font-bold text-gray-700">{request.clientEmail}</span>}
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Technical Site */}
          <section>
            <h3 className="text-sm font-black bg-gray-100 px-4 py-2 border-l-8 border-amber-500 uppercase tracking-widest mb-4">2. LOCALISATION ET NATURE DES TRAVAUX</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
              <div className="space-y-3">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lieu des travaux</span>
                  <span className="text-base font-black uppercase text-gray-900">{request.installationAddress}</span>
                  <span className="text-sm font-bold text-gray-700 uppercase">{request.installationCommune}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prestation demandée</span>
                  <span className="text-lg font-black text-blue-700 uppercase tracking-tighter">{request.serviceType}</span>
                </div>
              </div>
              
              {request.serviceType.toLowerCase().includes('branchement') && (
                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 space-y-3">
                  <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest border-b border-amber-200 pb-1">Spécifications Techniques</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-gray-400 uppercase">Usage</span>
                      <span className="text-[10px] font-black uppercase text-gray-900">{request.branchementType}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-gray-400 uppercase">Diamètre</span>
                      <span className="text-[10px] font-black uppercase text-gray-900">{request.diameter || '---'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {request.description && (
              <div className="mt-6 px-4">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Observations complémentaires</span>
                <p className="text-sm font-medium text-gray-600 mt-1 italic border-l-2 border-gray-200 pl-3">{request.description}</p>
              </div>
            )}
          </section>

          {/* Section 3: Validations / Visas */}
          <section className="pt-10">
            <h3 className="text-sm font-black bg-gray-100 px-4 py-2 border-l-8 border-emerald-600 uppercase tracking-widest mb-8">3. AVIS TECHNIQUE ET VISAS ADMINISTRATIFS</h3>
            
            <div className="grid grid-cols-3 gap-6">
              {/* Box 1: Chef d'Agence */}
              <div className="border border-gray-200 rounded-xl p-4 h-48 flex flex-col">
                <h4 className="text-[9px] font-black text-gray-800 uppercase tracking-wider mb-2 text-center border-b pb-1">Visa Chef d'Agence</h4>
                <div className="flex-1 flex flex-col justify-center items-center text-center">
                  {request.validations?.find(v => v.type === ValidationType.AGENCY && v.status === 'validated') ? (
                    <>
                      <div className="text-[10px] font-black text-emerald-600 mb-1">ACCORD ACCORDÉ</div>
                      <div className="text-[8px] font-bold text-gray-500 uppercase">Le {new Date(request.validations.find(v => v.type === ValidationType.AGENCY)?.validatedAt || '').toLocaleDateString()}</div>
                      <div className="mt-4 border-t border-dotted border-gray-300 w-full pt-1 text-[8px] italic">Signé électroniquement par {request.validations.find(v => v.type === ValidationType.AGENCY)?.userName}</div>
                    </>
                  ) : (
                    <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Cadre réservé</div>
                  )}
                </div>
              </div>

              {/* Box 2: Relation Clientèle */}
              <div className="border border-gray-200 rounded-xl p-4 h-48 flex flex-col">
                <h4 className="text-[9px] font-black text-gray-800 uppercase tracking-wider mb-2 text-center border-b pb-1">Visa Relation Clientèle</h4>
                <div className="flex-1 flex flex-col justify-center items-center text-center">
                  {request.validations?.find(v => v.type === ValidationType.CUSTOMER_SERVICE && v.status === 'validated') ? (
                    <>
                      <div className="text-[10px] font-black text-emerald-600 mb-1">CONTRÔLE VALIDÉ</div>
                      <div className="text-[8px] font-bold text-gray-500 uppercase">Le {new Date(request.validations.find(v => v.type === ValidationType.CUSTOMER_SERVICE)?.validatedAt || '').toLocaleDateString()}</div>
                      <div className="mt-4 border-t border-dotted border-gray-300 w-full pt-1 text-[8px] italic">Signé électroniquement par {request.validations.find(v => v.type === ValidationType.CUSTOMER_SERVICE)?.userName}</div>
                    </>
                  ) : (
                    <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Cadre réservé</div>
                  )}
                </div>
              </div>

              {/* Box 3: Direction / Juriste */}
              <div className="border border-gray-200 rounded-xl p-4 h-48 flex flex-col">
                <h4 className="text-[9px] font-black text-gray-800 uppercase tracking-wider mb-2 text-center border-b pb-1">Direction / Juriste</h4>
                <div className="flex-1 flex flex-col justify-center items-center text-center">
                  {request.validations?.find(v => v.type === ValidationType.LAWYER && v.status === 'validated') ? (
                    <>
                      <div className="text-[10px] font-black text-emerald-600 mb-1">CONFORMITÉ VÉRIFIÉE</div>
                      <div className="text-[8px] font-bold text-gray-500 uppercase">Le {new Date(request.validations.find(v => v.type === ValidationType.LAWYER)?.validatedAt || '').toLocaleDateString()}</div>
                      <div className="mt-4 border-t border-dotted border-gray-300 w-full pt-1 text-[8px] italic">Signé électroniquement par {request.validations.find(v => v.type === ValidationType.LAWYER)?.userName}</div>
                    </>
                  ) : (
                    <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Cadre réservé</div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-gray-100 flex justify-between items-center opacity-70 italic">
          <p className="text-[8px] font-bold text-gray-500">Document généré par ADE-MANAGER le {new Date().toLocaleString('fr-DZ')}</p>
          <p className="text-[8px] font-black text-blue-700 tracking-widest uppercase">www.ade.dz</p>
        </div>
      </div>
    </div>
  );
};
