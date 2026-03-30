import React, { useEffect, useState } from 'react';
import { WorkRequest, CommercialAgency, Centre } from '../types';
import { WorkRequestAcknowledgement } from './WorkRequestAcknowledgement';

interface WorkRequestSuccessProps {
  request: WorkRequest;
  agencies: CommercialAgency[];
  centres: Centre[];
  onBack: () => void;
}

export const WorkRequestSuccess: React.FC<WorkRequestSuccessProps> = ({ request, agencies, centres, onBack }) => {
  const [showPrint, setShowPrint] = useState(false);
  const agency = agencies.find(a => a.id === request.agencyId);
  const centre = centres.find(c => c.id === (agency?.centreId || ''));

  useEffect(() => {
    // Déclenchement automatique de l'impression après un court délai pour laisser l'UI s'afficher
    const timer = setTimeout(() => {
      setShowPrint(true);
      // L'appel à window.print() sera géré à l'intérieur du composant WorkRequestAcknowledgement ou ici
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (showPrint) {
    return (
      <WorkRequestAcknowledgement 
        request={request}
        agency={agency}
        centre={centre}
        onClose={() => setShowPrint(false)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-12 text-center space-y-8 animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Demande Enregistrée !</h2>
          <p className="text-lg text-gray-500 font-medium max-w-lg mx-auto">
            La demande de travaux a été correctement sauvegardée dans le système sous le numéro de référence suivant :
          </p>
          <div className="inline-block px-8 py-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <span className="text-3xl font-black text-blue-700 tracking-widest">{request.id}</span>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => setShowPrint(true)} 
            className="w-full sm:w-auto px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimer l'Accusé
          </button>
          <button 
            onClick={onBack} 
            className="w-full sm:w-auto px-10 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-gray-200 transition-all"
          >
            Retour à la Liste
          </button>
        </div>
        
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          L'impression se lancera automatiquement d'ici quelques secondes...
        </p>
      </div>
    </div>
  );
};
