import { Link } from 'react-router-dom';

const ScholarshipCard = ({ scholarship }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="card p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">
            {scholarship.title}
          </h3>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(scholarship.status)}`}>
              {scholarship.status}
            </span>
            <span className="text-sm text-secondary-500">
              {scholarship.vacancies} vacantes
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-secondary-600 text-sm mb-4 line-clamp-3">
        {scholarship.description}
      </p>

      {/* Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-secondary-500">Modalidad:</span>
          <span className="font-medium text-secondary-700 capitalize">
            {scholarship.modality}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-secondary-500">Niveles:</span>
          <span className="font-medium text-secondary-700">
            {scholarship.eligibleLevels?.join(', ') || 'N/A'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-secondary-500">Cierre:</span>
          <span className="font-medium text-secondary-700">
            {formatDate(scholarship.closeAt)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Link 
          to={`/scholarships/${scholarship.slug || scholarship._id}`}
          className="btn-primary text-sm"
        >
          Ver más
        </Link>
        {scholarship.canApply && (
          <Link 
            to={`/apply/${scholarship.slug || scholarship._id}`}
            className="btn-outline text-sm"
          >
            Postularme
          </Link>
        )}
      </div>
    </div>
  );
};

export default ScholarshipCard;
