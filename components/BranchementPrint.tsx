
import React from 'react';
import { WorkRequest, CommercialAgency, Centre, BranchementType } from '../types';

interface BranchementPrintProps {
  request: WorkRequest;
  agency?: CommercialAgency;
  centre?: Centre;
  onClose: () => void;
}

export const BranchementPrint: React.FC<BranchementPrintProps> = ({ request, agency, centre, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const agencyName = agency?.name || 'BERROUAGHIA';

  // Determine which branchement type checkboxes to check
  const isDomestiqueMaison = request.branchementType === BranchementType.DOMESTIQUE;
  const isImmeuble = request.branchementType === BranchementType.IMMEUBLE;
  const isCommercial = request.branchementType === BranchementType.COMMERCIAL;
  const isIndustriel = request.branchementType === BranchementType.INDUSTRIEL;
  const isChantier = request.branchementType === BranchementType.CHANTIER;
  const isIncendie = request.branchementType === BranchementType.INCENDIE;
  const isAutre = !request.branchementType || request.branchementType === BranchementType.AUTRE;

  // Determine type: Ordinaire, Temporaire, Spécial
  const branchementCategory = isChantier ? 'Temporaire' : (isIncendie || isIndustriel ? 'Spécial' : 'Ordinaire');

  return (
    <div className="fixed inset-0 z-[100] bg-white overflow-y-auto print:static print:bg-white">
      {/* Controls - Hidden during print */}
      <div className="sticky top-0 bg-gray-900 text-white p-4 flex justify-between items-center print:hidden shadow-xl z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <h2 className="font-black uppercase tracking-widest text-sm">Demande de Branchement - {request.id}</h2>
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
          .branchement-print-doc,
          .branchement-print-doc * {
            visibility: visible !important;
          }
          .branchement-print-doc {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
        .branchement-print-doc {
          font-family: Arial, Helvetica, sans-serif;
          color: #000;
          line-height: 1.25;
        }
        .branchement-print-doc .field-line {
          border-bottom: 1px solid #000;
          min-height: 18px;
          display: inline-block;
          padding: 0 4px;
          font-weight: bold;
          text-align: center;
        }
        .branchement-print-doc .checkbox {
          display: inline-block;
          width: 13px;
          height: 13px;
          border: 1.5px solid #000;
          margin-right: 6px;
          vertical-align: middle;
          position: relative;
          background: white;
        }
        .branchement-print-doc .checkbox.checked::after {
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
      <div className="branchement-print-doc max-w-[210mm] mx-auto p-6 md:p-8 bg-white print:p-0 print:m-0" style={{ fontSize: '10pt' }}>
        
        {/* Republic Text */}
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11pt', marginBottom: '8px' }}>
          الجمهورية الجزائرية الديمقراطية الشعبية
        </div>

        {/* === HEADER (3 colonnes) === */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ textAlign: 'left', lineHeight: 1.2, width: '33%' }}>
            <div style={{ fontSize: '9pt', fontWeight: 'bold' }}>Ministère des ressources en eau</div>
            <div style={{ fontSize: '9pt', fontWeight: 'bold' }}>E.P ALGERIENNE DES EAUX</div>
          </div>
          <div style={{ textAlign: 'center', width: '33%' }}>
            <img src="/ade.png" alt="ADE Logo" style={{ height: '70px', margin: '0 auto' }} />
          </div>
          <div style={{ textAlign: 'right', width: '33%', fontSize: '9pt', fontWeight: 'bold' }} dir="rtl">
            وزارة المــــوارد المائيــــــة<br />
            الجزائريــــــة للميــــــــــاه
          </div>
        </div>

        {/* === TITLE === */}
        <div style={{ textAlign: 'center', marginBottom: '2px', marginTop: '4px' }}>
          <h1 style={{ fontSize: '20pt', fontWeight: 'normal', margin: 0, letterSpacing: '1px' }}>DEMANDE DE BRANCHEMENT D'EAU POTABLE</h1>
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
            <span style={{ textDecoration: (request.type === 'Propriétaire' || request.type === 'Proprietaire') ? 'none' : 'line-through', fontWeight: (request.type === 'Propriétaire' || request.type === 'Proprietaire') ? 'bold' : 'normal' }}>Propriétaire</span>, {''}
            <span style={{ textDecoration: request.type === 'Locataire' ? 'none' : 'line-through', fontWeight: request.type === 'Locataire' ? 'bold' : 'normal' }}>Locataire</span>, {''}
            <span style={{ textDecoration: request.type === 'Mandataire' ? 'none' : 'line-through', fontWeight: request.type === 'Mandataire' ? 'bold' : 'normal' }}>Mandataire</span> {''}
            <span style={{ fontSize: '8pt', fontStyle: 'italic' }}>(rayer les mentions inutiles)</span>
          </p>
        </div>

        {/* === TYPE DE BRANCHEMENT === */}
        <div style={{ marginBottom: '4px' }}>
          <p style={{ fontSize: '9.5pt', marginBottom: '2px' }}>
            <strong>Et après avoir pris connaissance du règlement général du service public d'alimentation en eau potable en vigueur, demande à l'Algérienne des Eaux qu'il me soit consenti, un raccordement au réseau d'alimentation en eau potable de type : </strong>
            <span>{branchementCategory === 'Ordinaire' ? <strong>Ordinaire</strong> : 'Ordinaire'}</span>, {branchementCategory === 'Temporaire' ? <strong>Temporaire</strong> : 'Temporaire'}, {branchementCategory === 'Spécial' ? <strong>Spécial</strong> : 'Spécial'} <span style={{ fontSize: '8pt', fontStyle: 'italic' }}>(rayer les mentions inutiles)</span>
          </p>
        </div>

        {/* === POUR DES BESOINS === */}
        <div style={{ marginBottom: '20px', paddingLeft: '20px' }}>
          <p style={{ fontSize: '9.5pt', fontWeight: 'bold', marginBottom: '3px' }}>Pour des besoins : <span style={{ fontSize: '8pt', fontWeight: 'normal', fontStyle: 'italic' }}>(cocher la case correspondante)</span></p>
          
          <div style={{ paddingLeft: '10px', lineHeight: '1.5', fontSize: '9.5pt' }}>
            <div>
              <span className={`checkbox ${isDomestiqueMaison ? 'checked' : ''}`}></span>
              <span style={{ textDecoration: 'underline' }}>Domestiques</span>: Maison individuelle
            </div>
            <div style={{ paddingLeft: '80px' }}>
              <span className={`checkbox ${isImmeuble ? 'checked' : ''}`}></span>
              Immeuble collectif nombre de logements / locaux commerciaux : <span className="field-line" style={{ width: '80px' }}>{isImmeuble ? (request.branchementDetails || '') : ''}</span>
            </div>
            <div>
              <span className={`checkbox ${isCommercial ? 'checked' : ''}`}></span>
              Commerciaux (Artisans, commerçants)
            </div>
            <div>
              <span className={`checkbox ${isIndustriel ? 'checked' : ''}`}></span>
              Industrie ou tourisme
            </div>
            <div>
              <span className={`checkbox ${isChantier ? 'checked' : ''}`}></span>
              Les besoins de chantier
            </div>
            <div>
              <span className={`checkbox ${isIncendie ? 'checked' : ''}`}></span>
              Borne d'incendie
            </div>
            <div>
              <span className={`checkbox ${isAutre ? 'checked' : ''}`}></span>
              Autres (à préciser) : <span className="field-line" style={{ width: '200px' }}>
                {!request.branchementType ? (request.serviceType || '') : (request.branchementType === BranchementType.AUTRE ? (request.branchementDetails || '') : '')}
              </span>
            </div>
          </div>
        </div>

        {/* === ADRESSE DE BRANCHEMENT === */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', marginBottom: '4px' }}>
            <span style={{ fontSize: '10pt', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Adresse de branchement : </span>
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
              Diamètre du branchement : <span className="field-line" style={{ width: '80px' }}>{request.diameter || ''}</span> mm
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
