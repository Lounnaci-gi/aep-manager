
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
      <div className="max-w-[210mm] mx-auto p-6 md:p-10 bg-white text-gray-900 print:p-0 print:m-0 print:w-[210mm]">
        {/* En-tête */}
        <div className="flex justify-between items-start border-b-4 border-gray-900 pb-6 mb-8">
          <div className="flex items-center gap-6">
            <img src="/ade.png" alt="ADE Logo" className="h-32 w-auto object-contain" />
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-blue-700 tracking-tighter uppercase leading-none">ALGÉRIENNE DES EAUX</h1>
              <p className="text-sm font-black text-gray-500 uppercase tracking-widest">Unité de {centre?.name || '---'}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Agence : {agency?.name || '---'}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block border-4 border-emerald-600 px-6 py-2 mb-4 bg-emerald-50">
              <h2 className="text-xl font-black uppercase tracking-tighter text-emerald-700">DEMANDE D'ÉTABLISSEMENT<br/>DE DEVIS QUANTITATIF<br/>ET ESTIMATIF</h2>
            </div>
            <p className="text-sm font-black text-gray-900 uppercase">Réf : <span className="text-blue-700">{request.id}</span></p>
            <p className="text-xs font-bold text-gray-500 uppercase mt-1">Date : {new Date(request.createdAt).toLocaleDateString('fr-DZ')}</p>
          </div>
        </div>

        {/* Section 1: Informations Générales */}
        <section className="mb-8">
          <h3 className="text-sm font-black bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 border-l-8 border-blue-800 uppercase tracking-widest mb-4 text-white">
            1. DEMANDEUR / ABONNÉ
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="space-y-4">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Nom et Prénom / Raison Sociale</span>
                <span className="text-base font-black uppercase text-gray-900">
                  {request.businessName || `${request.civility} ${request.clientName}`}
                </span>
              </div>
              {request.idDocumentNumber && (
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Pièce d'Identité</span>
                  <span className="text-sm font-bold text-gray-700">
                    {request.idDocumentType} N° {request.idDocumentNumber}
                  </span>
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Qualité</span>
                <span className="text-sm font-bold text-gray-700">{request.type}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Adresse de Correspondance</span>
                <span className="text-sm font-bold text-gray-700 uppercase">{request.address}, {request.commune}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Coordonnées</span>
                <span className="text-sm font-bold text-gray-700">Tél : {request.clientPhone}</span>
                {request.clientEmail && (
                  <span className="text-sm font-bold text-gray-700">{request.clientEmail}</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Objet de la Demande de Devis */}
        <section className="mb-8">
          <h3 className="text-sm font-black bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2 border-l-8 border-emerald-800 uppercase tracking-widest mb-4 text-white">
            2. OBJET DE LA DEMANDE DE DEVIS
          </h3>
          <div className="px-4 space-y-4">
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
              <div className="flex flex-col mb-3">
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Nature des Travaux Demandés</span>
                <span className="text-xl font-black text-emerald-700 uppercase tracking-tighter">{request.serviceType}</span>
              </div>
              
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Localisation des Travaux</span>
                <span className="text-base font-black uppercase text-gray-900">{request.installationAddress}</span>
                <span className="text-sm font-bold text-gray-700 uppercase">{request.installationCommune}</span>
              </div>
            </div>

            {request.description && (
              <div className="mt-4">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Description Détaillée</span>
                <p className="text-sm font-medium text-gray-600 mt-1 italic border-l-2 border-emerald-300 pl-3">{request.description}</p>
              </div>
            )}
          </div>
        </section>

        {/* Section 3: Spécifications Techniques (si branchement) */}
        {request.serviceType.toLowerCase().includes('branchement') && (
          <section className="mb-8">
            <h3 className="text-sm font-black bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 border-l-8 border-amber-700 uppercase tracking-widest mb-4 text-white">
              3. SPÉCIFICATIONS TECHNIQUES
            </h3>
            <div className="px-4">
              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-amber-600 uppercase">Usage</span>
                    <span className="text-[10px] font-black uppercase text-gray-900">
                      {request.branchementType}
                    </span>
                    {request.branchementDetails && (
                      <span className="text-[8px] text-gray-500 italic mt-0.5">({request.branchementDetails})</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-amber-600 uppercase">Diamètre</span>
                    <span className="text-[10px] font-black uppercase text-gray-900">{request.diameter ? `${request.diameter} mm` : '---'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-amber-600 uppercase">Débit</span>
                    <span className="text-[10px] font-black uppercase text-gray-900">{request.flowRate || '---'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-amber-600 uppercase">Type</span>
                    <span className="text-[10px] font-black uppercase text-gray-900">{request.branchementType === 'Autre' ? 'Spécifique' : 'Standard'}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Section 4: Validations Administratives */}
        <section className="mb-8">
          <h3 className="text-sm font-black bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-2 border-l-8 border-purple-800 uppercase tracking-widest mb-6 text-white">
            4. VALIDATIONS ADMINISTRATIVES OBTENUES
          </h3>
          
          <div className="px-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-purple-50 border-b-2 border-purple-200">
                    <th className="text-[9px] font-black text-purple-700 uppercase tracking-widest text-left py-3 px-3">Service Validateur</th>
                    <th className="text-[9px] font-black text-purple-700 uppercase tracking-widest text-center py-3 px-3">Statut</th>
                    <th className="text-[9px] font-black text-purple-700 uppercase tracking-widest text-left py-3 px-3">Validé Par</th>
                    <th className="text-[9px] font-black text-purple-700 uppercase tracking-widest text-center py-3 px-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                        </svg>
                        <span className="text-sm font-bold text-gray-900">Chef d'Agence</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {request.validations?.find(v => v.type === ValidationType.AGENCY && v.status === 'validated') ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">✓</svg>
                          Validé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-400 px-3 py-1 rounded-full text-[9px] font-black uppercase">
                          En attente
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-sm font-bold text-gray-700">
                        {request.validations?.find(v => v.type === ValidationType.AGENCY && v.status === 'validated')?.userName || '---'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-xs font-bold text-gray-600">
                        {request.validations?.find(v => v.type === ValidationType.AGENCY && v.status === 'validated') 
                          ? new Date(request.validations.find(v => v.type === ValidationType.AGENCY && v.status === 'validated')!.validatedAt!).toLocaleDateString('fr-DZ')
                          : '---'
                        }
                      </span>
                    </td>
                  </tr>
                  
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                        </svg>
                        <span className="text-sm font-bold text-gray-900">Relation Clientèle</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {request.validations?.find(v => v.type === ValidationType.CUSTOMER_SERVICE && v.status === 'validated') ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">✓</svg>
                          Validé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-400 px-3 py-1 rounded-full text-[9px] font-black uppercase">
                          En attente
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-sm font-bold text-gray-700">
                        {request.validations?.find(v => v.type === ValidationType.CUSTOMER_SERVICE && v.status === 'validated')?.userName || '---'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-xs font-bold text-gray-600">
                        {request.validations?.find(v => v.type === ValidationType.CUSTOMER_SERVICE && v.status === 'validated') 
                          ? new Date(request.validations.find(v => v.type === ValidationType.CUSTOMER_SERVICE && v.status === 'validated')!.validatedAt!).toLocaleDateString('fr-DZ')
                          : '---'
                        }
                      </span>
                    </td>
                  </tr>
                  
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                        </svg>
                        <span className="text-sm font-bold text-gray-900">Direction / Juriste</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {request.validations?.find(v => v.type === ValidationType.LAWYER && v.status === 'validated') ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">✓</svg>
                          Validé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-400 px-3 py-1 rounded-full text-[9px] font-black uppercase">
                          En attente
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-sm font-bold text-gray-700">
                        {request.validations?.find(v => v.type === ValidationType.LAWYER && v.status === 'validated')?.userName || '---'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-xs font-bold text-gray-600">
                        {request.validations?.find(v => v.type === ValidationType.LAWYER && v.status === 'validated') 
                          ? new Date(request.validations.find(v => v.type === ValidationType.LAWYER && v.status === 'validated')!.validatedAt!).toLocaleDateString('fr-DZ')
                          : '---'
                        }
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {allValidationsComplete && (
              <div className="mt-4 bg-emerald-50 border-2 border-emerald-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                    ✅ TOUTES LES VALIDATIONS SONT COMPLÈTES - DOSSIER ÉLIGIBLE À L'ÉTABLISSEMENT DU DEVIS
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Section 5: Décision */}
        <section className="mb-8">
          <h3 className="text-sm font-black bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 border-l-8 border-red-800 uppercase tracking-widest mb-4 text-white">
            5. DÉCISION ET ÉTABLISSEMENT DU DEVIS
          </h3>
          <div className="px-4">
            <div className="border-2 border-gray-300 rounded-lg p-6 min-h-[150px]">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Vu la demande ci-dessus et les validations obtenues,</p>
              <p className="text-sm font-black text-gray-900 uppercase leading-relaxed mb-4">
                IL EST DEMANDÉ À M./MME LE(CHEF CENTRE / RESPONSABLE COMMERCIAL) DE BIEN VOULOIR ÉTABLIR UN DEVIS QUANTITATIF ET ESTIMATIF POUR LA RÉALISATION DES TRAVAUX MENTIONNÉS.
              </p>
              <div className="mt-6 flex justify-between items-end">
                <div className="text-center">
                  <p className="text-[9px] font-black text-gray-400 uppercase mb-8">Fait à ________________, le ___/___/______</p>
                  <p className="text-[10px] font-black text-gray-500 uppercase">Signature et Cachet</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-black text-gray-400 uppercase mb-8">Le Demandeur</p>
                  <p className="text-[10px] font-black text-gray-500 uppercase">(Signature)</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center opacity-70 italic">
          <p className="text-[8px] font-bold text-gray-500">Document généré par ADE-MANAGER le {new Date().toLocaleString('fr-DZ')}</p>
          <p className="text-[8px] font-black text-emerald-700 tracking-widest uppercase">www.ade.dz</p>
        </div>
      </div>
    </div>
  );
};
