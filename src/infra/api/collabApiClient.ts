import { ApiClient } from 'collaboratif-client-api';

import { config } from '@/shared/config/env';

/**
 * Client API collaboratif préconfiguré (signalements, utilisateur, etc.).
 */
export const collabApiClient = new ApiClient(
  config.api.baseUrl,
  config.oAuth.baseUrl,
  config.oAuth.clientId,
);
