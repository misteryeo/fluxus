'use client';

import { MissingItem } from '@/utils/scanMissing';
import { Audience } from '@/types/audience';

interface MissingInfoProps {
  missing: MissingItem[];
  onJump: (key: string) => void;
}

const AUDIENCE_COLORS: Record<Audience, string> = {
  internal: 'bg-blue-100 text-blue-800',
  customer: 'bg-green-100 text-green-800',
  investor: 'bg-purple-100 text-purple-800',
  public: 'bg-gray-100 text-gray-800',
};

const AUDIENCE_LABELS: Record<Audience, string> = {
  internal: 'Internal',
  customer: 'Customer',
  investor: 'Investor',
  public: 'Public',
};

export function MissingInfo({ missing, onJump }: MissingInfoProps) {
  if (missing.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <div className="text-2xl mb-2">✅</div>
        <div className="text-lg font-medium">No missing info</div>
        <div className="text-sm">All required fields are filled out</div>
      </div>
    );
  }

  // Group items by field category
  const grouped = missing.reduce((acc, item) => {
    const category = item.key.split('.')[0];
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MissingItem[]>);

  const categoryLabels: Record<string, string> = {
    meta: 'Meta Information',
    links: 'Links',
    metrics: 'Metrics',
    notes: 'Notes',
  };

  return (
    <div className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Missing Information ({missing.length})
        </h3>
        <p className="text-sm text-gray-600">
          Click on any item below to jump to the corresponding input field.
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h4 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">
              {categoryLabels[category] || category}
            </h4>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={`${item.key}-${index}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => onJump(item.key)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {item.label}
                      </span>
                      {item.audience && (
                        <span className={`px-2 py-1 text-xs rounded-full ${AUDIENCE_COLORS[item.audience]}`}>
                          {AUDIENCE_LABELS[item.audience]}
                        </span>
                      )}
                    </div>
                    {item.hint && (
                      <div className="text-sm text-gray-600">
                        {item.hint}
                      </div>
                    )}
                  </div>
                  <div className="text-gray-400 ml-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
