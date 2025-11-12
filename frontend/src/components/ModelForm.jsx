import { useState, useEffect } from 'react';
import axios from 'axios';
import './ModelForm.css';

const ModelForm = ({ model, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    model_name: '',
    framework: '',
    accuracy: '',
    precision: '',
    recall: '',
    f1_score: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = 'http://localhost:3000';

  useEffect(() => {
    if (model) {
      setFormData({
        model_name: model.model_name,
        framework: model.framework,
        accuracy: model.accuracy,
        precision: model.precision,
        recall: model.recall,
        f1_score: model.f1_score,
      });
    }
  }, [model]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateMetric = (value) => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 && num <= 1;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate metrics
    const metrics = ['accuracy', 'precision', 'recall', 'f1_score'];
    for (const metric of metrics) {
      if (!validateMetric(formData[metric])) {
        setError(`${metric} must be a number between 0 and 1`);
        return;
      }
    }

    setLoading(true);

    try {
      if (model) {
        // Update existing model
        await axios.put(
          `${API_URL}/models/${model.id}`,
          formData,
          { withCredentials: true }
        );
      } else {
        // Create new model
        await axios.post(
          `${API_URL}/models`,
          formData,
          { withCredentials: true }
        );
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save model');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{model ? 'Edit Model' : 'Add New Model'}</h2>
          <button onClick={onClose} className="btn-close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="model-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="model_name">Model Name *</label>
              <input
                type="text"
                id="model_name"
                name="model_name"
                value={formData.model_name}
                onChange={handleChange}
                required
                placeholder="e.g., Random Forest Classifier"
              />
            </div>

            <div className="form-group">
              <label htmlFor="framework">Framework *</label>
              <input
                type="text"
                id="framework"
                name="framework"
                value={formData.framework}
                onChange={handleChange}
                required
                placeholder="e.g., Scikit-learn, TensorFlow"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="accuracy">Accuracy (0-1) *</label>
              <input
                type="number"
                id="accuracy"
                name="accuracy"
                value={formData.accuracy}
                onChange={handleChange}
                required
                step="0.0001"
                min="0"
                max="1"
                placeholder="e.g., 0.9523"
              />
            </div>

            <div className="form-group">
              <label htmlFor="precision">Precision (0-1) *</label>
              <input
                type="number"
                id="precision"
                name="precision"
                value={formData.precision}
                onChange={handleChange}
                required
                step="0.0001"
                min="0"
                max="1"
                placeholder="e.g., 0.9412"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="recall">Recall (0-1) *</label>
              <input
                type="number"
                id="recall"
                name="recall"
                value={formData.recall}
                onChange={handleChange}
                required
                step="0.0001"
                min="0"
                max="1"
                placeholder="e.g., 0.9387"
              />
            </div>

            <div className="form-group">
              <label htmlFor="f1_score">F1 Score (0-1) *</label>
              <input
                type="number"
                id="f1_score"
                name="f1_score"
                value={formData.f1_score}
                onChange={handleChange}
                required
                step="0.0001"
                min="0"
                max="1"
                placeholder="e.g., 0.9399"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : model ? 'Update Model' : 'Add Model'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModelForm;
