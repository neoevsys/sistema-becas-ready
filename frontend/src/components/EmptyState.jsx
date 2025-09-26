const EmptyState = ({ 
  icon,
  title,
  description,
  action,
  className = ''
}) => {
  const defaultIcon = (
    <svg className="w-12 h-12 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="mx-auto w-12 h-12 mb-4">
        {icon || defaultIcon}
      </div>
      
      <h3 className="text-lg font-medium text-secondary-900 mb-2">
        {title || 'No hay elementos'}
      </h3>
      
      <p className="text-secondary-500 mb-6 max-w-md mx-auto">
        {description || 'No se encontraron elementos para mostrar en este momento.'}
      </p>
      
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
