const VALID_INSPECTION_STATUSES = new Set([
  'No issues',
  'Needs attention',
  'Critical',
  'Draft',
  'Reviewed',
  'Submitted'
]);

const VALID_ASSET_STATUSES = new Set([
  'Operational',
  'Maintenance',
  'Offline',
  'Faulty',
  'operational',
  'maintenance',
  'offline',
  'faulty'
]);

const normalizeStatusList = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const validateInspectionPayload = (payload = {}, userId) => {
  const errors = [];

  if (!userId) {
    errors.push('User context is required to validate inspection data.');
  }

  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['Inspection payload must be an object.'] };
  }

  const statuses = normalizeStatusList(payload.status);
  if (statuses.length === 0) {
    errors.push('Inspection status is required.');
  } else {
    const invalidStatuses = statuses.filter((status) => !VALID_INSPECTION_STATUSES.has(status));
    if (invalidStatuses.length > 0) {
      errors.push(`Inspection status contains unsupported values: ${invalidStatuses.join(', ')}`);
    }
  }

  const requiredSections = ['externalAssets', 'groundFloor', 'firstFloor', 'secondFloor'];
  requiredSections.forEach((section) => {
    const value = payload[section];
    const isMissing = value === undefined || value === null || typeof value !== 'object' || Object.keys(value).length === 0;

    if (isMissing) {
      errors.push(`${section} is required.`);
    }
  });

  if (payload.inspectionDate) {
    const parsed = new Date(payload.inspectionDate);
    if (Number.isNaN(parsed.getTime())) {
      errors.push('inspectionDate must be a valid date.');
    }
  }

  return { valid: errors.length === 0, errors };
};

const validateAssetPayload = (payload = {}) => {
  const errors = [];

  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['Asset payload must be an object.'] };
  }

  if (!payload.pumpNo && !payload.generatorSet) {
    errors.push('Asset reference is required (pumpNo or generatorSet).');
  }

  if (payload.startDate && payload.stopDate) {
    const start = new Date(payload.startDate);
    const stop = new Date(payload.stopDate);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(stop.getTime()) && stop < start) {
      errors.push('stop date cannot be earlier than the start date.');
    }
  }

  if (payload.status) {
    const normalized = String(payload.status).trim();
    if (!VALID_ASSET_STATUSES.has(normalized)) {
      errors.push(`status must be one of: ${Array.from(VALID_ASSET_STATUSES).join(', ')}`);
    }
  }

  return { valid: errors.length === 0, errors };
};

module.exports = {
  validateInspectionPayload,
  validateAssetPayload,
  VALID_INSPECTION_STATUSES,
  VALID_ASSET_STATUSES,
};
