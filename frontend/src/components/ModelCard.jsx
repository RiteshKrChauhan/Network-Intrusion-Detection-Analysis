import { useAuth } from '../context/AuthContext';
import './ModelCard.css';

const ModelCard = ({ model, onEdit, onDelete }) => {
  const { isAdmin } = useAuth();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getMetricColor = (value) => {
    const numValue = parseFloat(value);
    if (numValue >= 0.9) return '#10b981';
    if (numValue >= 0.8) return '#3b82f6';
    if (numValue >= 0.7) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="model-card">
      <div className="model-card-header">
        <div>
          <h3 className="model-name">{model.model_name}</h3>
          <span className="model-framework">{model.framework}</span>
        </div>
        {isAdmin && (
          <div className="model-actions">
            <button
              onClick={() => onEdit(model)}
              className="btn-icon btn-edit"
              title="Edit"
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(model.id)}
              className="btn-icon btn-delete"
              title="Delete"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      <div className="model-metrics">
        <div className="metric">
          <span className="metric-label">Accuracy</span>
          <span
            className="metric-value"
            style={{ color: getMetricColor(model.accuracy) }}
          >
            {(parseFloat(model.accuracy) * 100).toFixed(2)}%
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">Precision</span>
          <span
            className="metric-value"
            style={{ color: getMetricColor(model.precision) }}
          >
            {(parseFloat(model.precision) * 100).toFixed(2)}%
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">Recall</span>
          <span
            className="metric-value"
            style={{ color: getMetricColor(model.recall) }}
          >
            {(parseFloat(model.recall) * 100).toFixed(2)}%
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">F1 Score</span>
          <span
            className="metric-value"
            style={{ color: getMetricColor(model.f1_score) }}
          >
            {(parseFloat(model.f1_score) * 100).toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="model-footer">
        <div className="model-date">
          <span className="date-label">Created:</span>
          <span>{formatDate(model.date_created)}</span>
        </div>
        {model.date_updated && model.date_updated !== model.date_created && (
          <div className="model-date">
            <span className="date-label">Updated:</span>
            <span>{formatDate(model.date_updated)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelCard;
