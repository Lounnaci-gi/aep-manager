
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

      {/* Print-specific styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 8mm 12mm;
          }
          body * {
            visibility: hidden;
          }
          .work-request-print-doc,
          .work-request-print-doc * {
            visibility: visible !important;
          }
          .work-request-print-doc {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
        .work-request-print-doc {
          font-family: Arial, Helvetica, sans-serif;
          color: #000;
          line-height: 1.25;
        }
        .work-request-print-doc .field-line {
          border-bottom: 1px solid #000;
          min-height: 18px;
          display: inline-block;
          padding: 0 4px;
          font-weight: bold;
          text-align: center;
        }
        .work-request-print-doc .checkbox {
          display: inline-block;
          width: 13px;
          height: 13px;
          border: 1.5px solid #000;
          margin-right: 6px;
          vertical-align: middle;
          position: relative;
          background: white;
        }
        .work-request-print-doc .checkbox.checked::after {
          content: '✓';
          position: absolute;
          top: -3px;
          left: 1px;
          font-size: 13px;
          font-weight: bold;
          color: #000;
        }
      `}</style>

      {/* Document Content */}
      <div className="work-request-print-doc max-w-[210mm] mx-auto p-6 md:p-8 bg-white print:p-0 print:m-0" style={{ fontSize: '10pt' }}>
        
        {/* === HEADER === */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2px' }}>
          <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
            <div style={{ fontSize: '10pt', fontWeight: 'bold' }}>|ALGERIENNE DES EAUX</div>
            <div style={{ fontSize: '9pt', fontWeight: 'bold', paddingLeft: '8px' }}>Zone d'Alger</div>
            <div style={{ fontSize: '9pt', fontWeight: 'bold', paddingLeft: '8px' }}>Unité de {centre?.name || 'Médéa'}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <img src="/ade.png" alt="ADE Logo" style={{ height: '110px', margin: '0 auto' }} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10pt', fontWeight: 'bold' }}>Agence de {agency?.name || '........................'}</div>
          </div>
        </div>

        {/* === TITLE === */}
        <div style={{ textAlign: 'center', marginBottom: '2px', marginTop: '4px' }}>
          <h1 style={{ fontSize: '18pt', fontWeight: 'normal', margin: 0, letterSpacing: '1px' }}>DEMANDE DE {request.serviceType.toUpperCase()}</h1>
          <p style={{ fontSize: '11pt', fontWeight: 'bold', margin: '4px 0', letterSpacing: '0.5px', textTransform: 'uppercase', backgroundColor: '#000', color: '#fff', padding: '3px 0', width: '100%', textAlign: 'center' }}>
            DOCUMENT A RETOURNER AU SERVICE DES EAUX DUMENT REMPLI ET SIGNÉ
          </p>
        </div>



        {/* Réf */}
        <div style={{ textAlign: 'right', fontSize: '9pt', marginBottom: '2px' }}>
          <strong>Réf : </strong><span className="field-line" style={{ width: '150px' }}>{request.id}</span>
        </div>

        {/* === JE SOUSSIGNÉ === */}
        <div style={{ marginBottom: '25px' }}>
          <p style={{ fontWeight: 'bold', fontSize: '10pt', marginBottom: '3px' }}>
            Je soussigné (e) <span style={{ fontSize: '8.5pt', fontStyle: 'italic' }}>Madame, Mademoiselle, Monsieur (rayer les mentions inutiles)</span>
          </p>
          
          <div style={{ display: 'flex', gap: '0', marginBottom: '3px' }}>
            <span style={{ fontSize: '9pt', textDecoration: 'underline', whiteSpace: 'nowrap' }}>Nom</span>
            <span style={{ fontSize: '9pt', whiteSpace: 'nowrap' }}>&nbsp;(ou Raison sociale)</span>
            <span className="field-line" style={{ flex: 1, marginLeft: '4px' }}>
              {request.businessName || request.clientName?.split(' ')[0] || ''}
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: '0', marginBottom: '3px' }}>
            <span style={{ fontSize: '9pt' }}>Prénom</span>
            <span className="field-line" style={{ flex: 1, marginLeft: '4px' }}>
              {request.clientName?.split(' ').slice(1).join(' ') || ''}
            </span>
          </div>

          <div style={{ marginBottom: '1px' }}>
            <span style={{ fontSize: '9pt', textDecoration: 'underline' }}>Adresse de correspondance</span><span style={{ fontSize: '9pt' }}>:</span>
          </div>
          
          <div style={{ display: 'flex', marginBottom: '2px' }}>
            <span style={{ fontSize: '9pt', whiteSpace: 'nowrap' }}>Rue</span>
            <span className="field-line" style={{ flex: 1, marginLeft: '4px' }}>{request.address || ''}</span>
          </div>
          
          <div style={{ display: 'flex', marginBottom: '2px' }}>
            <span style={{ fontSize: '9pt', whiteSpace: 'nowrap' }}>Commune</span>
            <span className="field-line" style={{ flex: 1, marginLeft: '4px' }}>{request.commune || ''}</span>
          </div>
          
          <div style={{ display: 'flex', marginBottom: '3px' }}>
            <span style={{ fontSize: '9pt', whiteSpace: 'nowrap' }}>Tél</span>
            <span className="field-line" style={{ flex: 1, marginLeft: '4px' }}>{request.clientPhone || request.correspondencePhone || ''}</span>
          </div>
        </div>

        {/* === QUALITÉ === */}
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '9.5pt', marginBottom: '2px' }}>
            <strong>Et agissant en qualité de : </strong>
            <span>{request.type || 'Propriétaire'}</span>, Locataire, Mandataire <span style={{ fontSize: '8pt', fontStyle: 'italic' }}>(rayer les mentions inutiles)</span>
          </p>
        </div>

        {/* === TYPE DE BRANCHEMENT === */}
        <div style={{ marginBottom: '4px' }}>
          <p style={{ fontSize: '9.5pt', marginBottom: '2px' }}>
            <strong>Et après avoir pris connaissance du règlement général du service public d'alimentation en eau potable en vigueur, demande à l'Algérienne des Eaux qu'il me soit consenti, un raccordement au réseau d'alimentation en eau potable de type : </strong>
            <span>{request.branchementType === BranchementType.CHANTIER ? 'Ordinaire' : <strong>Ordinaire</strong>}</span>, {request.branchementType === BranchementType.CHANTIER ? <strong>Temporaire</strong> : 'Temporaire'}, {request.branchementType === BranchementType.INCENDIE || request.branchementType === BranchementType.INDUSTRIEL ? <strong>Spécial</strong> : 'Spécial'} <span style={{ fontSize: '8pt', fontStyle: 'italic' }}>(rayer les mentions inutiles)</span>
          </p>
        </div>

        {/* === POUR DES BESOINS === */}
        <div style={{ marginBottom: '20px', paddingLeft: '20px' }}>
          <p style={{ fontSize: '9.5pt', fontWeight: 'bold', marginBottom: '3px' }}>Pour des besoins : <span style={{ fontSize: '8pt', fontWeight: 'normal', fontStyle: 'italic' }}>(cocher la case correspondante)</span></p>
          
          <div style={{ paddingLeft: '10px', lineHeight: '1.5', fontSize: '9.5pt' }}>
            <div>
              <span className={`checkbox ${request.branchementType === BranchementType.DOMESTIQUE ? 'checked' : ''}`}></span>
              <span style={{ textDecoration: 'underline' }}>Domestiques</span>: Maison individuelle
            </div>
            <div style={{ paddingLeft: '80px' }}>
              <span className={`checkbox ${request.branchementType === BranchementType.IMMEUBLE ? 'checked' : ''}`}></span>
              Immeuble collectif nombre de logements / locaux commerciaux : <span className="field-line" style={{ width: '80px' }}>{request.branchementType === BranchementType.IMMEUBLE ? (request.branchementDetails || '') : ''}</span>
            </div>
            <div>
              <span className={`checkbox ${request.branchementType === BranchementType.COMMERCIAL ? 'checked' : ''}`}></span>
              Commerciaux (Artisans, commerçants)
            </div>
            <div>
              <span className={`checkbox ${request.branchementType === BranchementType.INDUSTRIEL ? 'checked' : ''}`}></span>
              Industrie ou tourisme
            </div>
            <div>
              <span className={`checkbox ${request.branchementType === BranchementType.CHANTIER ? 'checked' : ''}`}></span>
              Les besoins de chantier
            </div>
            <div>
              <span className={`checkbox ${request.branchementType === BranchementType.INCENDIE ? 'checked' : ''}`}></span>
              Borne d'incendie
            </div>
            <div>
              <span className={`checkbox ${(!request.branchementType || request.branchementType === BranchementType.AUTRE) ? 'checked' : ''}`}></span>
              Autres (à préciser) : <span className="field-line" style={{ width: '200px' }}>
                {(!request.branchementType) 
                  ? (request.serviceType || '') 
                  : (request.branchementType === BranchementType.AUTRE ? (request.branchementDetails || '') : '')}
              </span>
            </div>
          </div>
        </div>

        {/* === ADRESSE DE BRANCHEMENT === */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', marginBottom: '4px' }}>
            <span style={{ fontSize: '10pt', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Adresse du site : </span>
            <span className="field-line" style={{ flex: 1, marginLeft: '4px' }}>
              {request.installationAddress}{request.installationCommune ? `, ${request.installationCommune}` : ''}
            </span>
          </div>
        </div>

        {/* === CADRE TECHNIQUE === */}
        <div style={{ marginBottom: '25px' }}>
          <p style={{ fontSize: '9pt', marginBottom: '4px' }}>
            <strong>Dans le cadre d'un branchement lié à un besoin pour la construction d'un immeuble, à des besoins industriels ou de chantier, veuillez préciser les informations suivantes :</strong>
          </p>
          <div style={{ display: 'flex', gap: '40px', fontSize: '9.5pt' }}>
            <div>
              Diamètre du raccordement : <span className="field-line" style={{ width: '80px' }}>{request.diameter || ''}</span> mm
            </div>
          </div>
          <div style={{ display: 'flex', gap: '40px', fontSize: '9.5pt', marginTop: '2px' }}>
            <div>
              Débit moyen horaire&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: <span className="field-line" style={{ width: '80px' }}>{request.flowRate || ''}</span>
            </div>
          </div>
        </div>

        {/* === ENGAGEMENT === */}
        <div style={{ marginBottom: '30px' }}>
          <p style={{ fontSize: '9pt', textAlign: 'justify' }}>
            Je m'engage à me conformer aux prescriptions du Règlement Général du Service des Eaux dont un exemplaire m'a été remis sur demande ou consulté au niveau du service « accueil clientèle » de l'Algérienne des Eaux.
          </p>
        </div>

        {/* === SIGNATURE === */}
        <div style={{ marginBottom: '50px', marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5pt' }}>
            <div>
              Fait à , <strong>{agency?.name || '........................'}</strong> le <span className="field-line" style={{ width: '150px' }}>{new Date(request.createdAt).toLocaleDateString('fr-DZ')}</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold' }}>Signature</div>
              <div style={{ fontSize: '8.5pt' }}>Lu et Approuvé</div>
            </div>
          </div>
        </div>

        {/* === SEPARATOR === */}
        <div style={{ borderTop: '2px solid #000', marginTop: '10px', marginBottom: '4px' }}></div>

        {/* === PARTIE RÉSERVÉE ADE === */}
        <div style={{ fontSize: '9.5pt' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>Partie réservée à l'Algérienne des Eaux – A.D.E</p>
          <div style={{ display: 'flex', marginBottom: '4px' }}>
            <span>Date de réception : </span>
            <span className="field-line" style={{ flex: 1, marginLeft: '4px', textAlign: 'left' }}>{new Date(request.createdAt).toLocaleDateString('fr-DZ')}</span>
          </div>
        </div>

        {/* Footer - screen only */}
        <div className="print:hidden" style={{ marginTop: '30px', paddingTop: '12px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', opacity: 0.5, fontStyle: 'italic', fontSize: '8pt' }}>
          <span>Document généré par ADE-MANAGER le {new Date().toLocaleString('fr-DZ')}</span>
          <span style={{ fontWeight: 'bold', color: '#1d4ed8' }}>www.ade.dz</span>
        </div>
      </div>
    </div>
  );
};
