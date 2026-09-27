import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { benefitsAPI } from '../../api';
import usePageTitle from '../../hooks/usePageTitle';
import { ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function BenefitsFormPage() {
  usePageTitle("Record Benefits");
  const { ideaId, implementationId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    costSavingsINR: 0,
    revenueIncreaseINR: 0,
    efficiencyImprovementPct: 0,
    productivityGainPct: 0,
    operationalDescription: '',
    customerSatisfactionChange: '',
    innovationImpactRating: 5,
  });

  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (formData) => benefitsAPI.create(formData),
    onSuccess: () => {
      navigate('/implementations/my');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to submit benefits realization record.');
    }
  });

  const handleInputChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const totalFinancial = Number(form.costSavingsINR || 0) + Number(form.revenueIncreaseINR || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Rule: Evidence required if > 1 Lakh
    if (totalFinancial > 100000 && files.length === 0) {
      setError('Evidence attachment is mandatory for financial benefits exceeding ₹1,00,000 (FR-08-01).');
      return;
    }

    // Rule: Operational description min 50 chars
    if (form.operationalDescription.trim().length < 50) {
      setError('Operational description must be at least 50 characters long (FR-08-02).');
      return;
    }

    const formData = new FormData();
    formData.append('ideaId', ideaId);
    formData.append('implementationId', implementationId);
    formData.append('financial', JSON.stringify({
      costSavingsINR: Number(form.costSavingsINR),
      revenueIncreaseINR: Number(form.revenueIncreaseINR)
    }));
    formData.append('operational', JSON.stringify({
      efficiencyImprovementPct: Number(form.efficiencyImprovementPct),
      productivityGainPct: Number(form.productivityGainPct),
      description: form.operationalDescription
    }));
    formData.append('strategic', JSON.stringify({
      customerSatisfactionChange: form.customerSatisfactionChange ? Number(form.customerSatisfactionChange) : null,
      innovationImpactRating: Number(form.innovationImpactRating)
    }));

    files.forEach(f => {
      formData.append('evidence', f);
    });

    mutation.mutate(formData);
  };

  return (
    <div className="page-enter max-w-[800px] mx-auto pb-12">
      <button onClick={() => navigate(-1)} className="text-sm text-theme-text/80 hover:text-theme-accent flex items-center gap-1 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to Implementations
      </button>

      <div className="mb-8">
        <h1 className="text-display text-3xl text-theme-text mb-2">Record Benefits Realization</h1>
        <p className="text-theme-text/80">Log financial, operational, and strategic benefits achieved post-implementation.</p>
      </div>

      <div className="glass rounded-2xl p-6 md:p-8">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-error-light border border-error/20 text-error-text flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Financial Benefits */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-theme-text border-b border-theme-border/50 pb-2">Financial Benefits</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="benefits-cost-savings" className="text-label block mb-2">Cost Savings (INR ₹)</label>
                <input
                  id="benefits-cost-savings"
                  type="number"
                  name="costSavingsINR"
                  value={form.costSavingsINR} 
                  onChange={handleInputChange} 
                  className="input-base" 
                  min="0"
                />
              </div>

              <div>
                <label htmlFor="benefits-revenue-increase" className="text-label block mb-2">Revenue Increase (INR ₹)</label>
                <input
                  id="benefits-revenue-increase"
                  type="number"
                  name="revenueIncreaseINR"
                  value={form.revenueIncreaseINR} 
                  onChange={handleInputChange} 
                  className="input-base" 
                  min="0"
                />
              </div>
            </div>

            {/* Evidence attachment indicator */}
            <div className={`p-4 rounded-xl border transition-colors ${totalFinancial > 100000 ? 'bg-theme-accent/10 border-theme-accent/40' : 'bg-theme-surface/40 border-theme-border'}`}>
              <label htmlFor="benefits-evidence" className="text-label block mb-2">
                Evidence Document {totalFinancial > 100000 && <span className="text-theme-accent">* (Mandatory for &gt; ₹1 Lakh)</span>}
              </label>
              <input
                id="benefits-evidence"
                type="file"
                multiple 
                onChange={handleFileChange} 
                className="block w-full text-xs text-theme-text/80 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-theme-surface file:text-theme-text hover:file:bg-theme-border cursor-pointer"
              />
            </div>
          </div>

          {/* Operational Benefits */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-theme-text border-b border-theme-border/50 pb-2">Operational Impact</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="benefits-efficiency" className="text-label block mb-2">Efficiency Improvement (%)</label>
                <input
                  id="benefits-efficiency"
                  type="number"
                  name="efficiencyImprovementPct"
                  value={form.efficiencyImprovementPct} 
                  onChange={handleInputChange} 
                  className="input-base" 
                  min="0" max="100"
                />
              </div>

              <div>
                <label htmlFor="benefits-productivity" className="text-label block mb-2">Productivity Gain (%)</label>
                <input
                  id="benefits-productivity"
                  type="number"
                  name="productivityGainPct"
                  value={form.productivityGainPct} 
                  onChange={handleInputChange} 
                  className="input-base" 
                  min="0" max="100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="benefits-operational-description" className="text-label block mb-2">Operational Description <span className="text-error-text">* (min 50 chars)</span></label>
              <textarea
                id="benefits-operational-description"
                name="operationalDescription"
                rows={4} 
                value={form.operationalDescription} 
                onChange={handleInputChange} 
                className="input-base resize-y"
                placeholder="Explain the process improvements and operational impact achieved..."
              />
              <p className={`text-xs mt-1 ${form.operationalDescription.trim().length < 50 ? 'text-theme-text0' : 'text-success-text'}`}>
                {form.operationalDescription.trim().length}/50 characters
              </p>
            </div>
          </div>

          {/* Strategic Benefits */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-theme-text border-b border-theme-border/50 pb-2">Strategic Rating</h3>
            
            <div>
              <label htmlFor="benefits-innovation-rating" className="text-label block mb-2">Innovation Impact Rating (1 - 10)</label>
              <input
                id="benefits-innovation-rating"
                type="range"
                name="innovationImpactRating"
                min="1" max="10" 
                value={form.innovationImpactRating} 
                onChange={handleInputChange} 
                className="range"
              />
              <div className="text-right text-sm font-bold text-theme-accent mt-1">
                {form.innovationImpactRating} / 10
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-theme-border/50">
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Submitting...' : <><CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Submit Benefits Record</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
