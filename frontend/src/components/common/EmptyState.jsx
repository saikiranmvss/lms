import { Link } from 'react-router-dom';

export default function EmptyState({ icon: Icon, title, description, action, actionLink, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
          <Icon className="w-8 h-8 text-slate-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      {description && <p className="text-slate-500 text-sm max-w-sm mb-6">{description}</p>}
      {actionLink && actionLabel && (
        <Link to={actionLink} className="btn-primary">{actionLabel}</Link>
      )}
      {action && actionLabel && (
        <button onClick={action} className="btn-primary">{actionLabel}</button>
      )}
    </div>
  );
}
